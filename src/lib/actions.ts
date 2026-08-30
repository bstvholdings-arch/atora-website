/**
 * Server actions for admin CRUD operations.
 * Each action wraps a database write and is invoked from admin pages.
 */
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import db, { type ProductMedia, type AboutContent, type AboutPhoto } from '@/lib/db';
import { getCurrentAdmin, createSession, destroySession } from '@/lib/auth';
import { setManySettings } from '@/lib/settings';
import { slugify } from '@/lib/slug';
/* ============================================================
 * AUTH
 * ============================================================ */
export async function loginAction(formData: FormData): Promise<{
    ok: boolean;
    error?: string;
}> {
    const email = formData.get('email')?.toString().trim().toLowerCase() ?? '';
    const password = formData.get('password')?.toString() ?? '';
    if (!email || !password)
        return { ok: false, error: 'Email and password are required.' };
    const row = await db
        .prepare('SELECT id, password_hash FROM admin_users WHERE email = ?')
        .get(email) as {
        id: number;
        password_hash: string;
    } | undefined;
    if (!row)
        return { ok: false, error: 'Invalid email or password.' };
    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid)
        return { ok: false, error: 'Invalid email or password.' };
    await createSession(row.id);
    return { ok: true };
}
export async function logoutAction() {
    await destroySession();
    redirect('/admin/login');
}
/* ============================================================
 * BRANDS
 * ============================================================ */
async function uniqueBrandSlug(slug: string): Promise<string> {
    let s = slug;
    let i = 2;
    while (await db.prepare('SELECT id FROM brands WHERE slug = ?').get(s)) {
        s = `${slug}-${i}`;
        i++;
    }
    return s;
}
export async function createBrandAction(formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    const name_en = formData.get('name_en')?.toString().trim() ?? '';
    if (!name_en)
        return;
    const slug = await uniqueBrandSlug(slugify(name_en));
    await db.prepare(`INSERT INTO brands (slug, name_en, name_bm, name_zh, logo, description_en, description_bm, description_zh, display_order, featured, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(slug, name_en, formData.get('name_bm')?.toString() || null, formData.get('name_zh')?.toString() || null, formData.get('logo')?.toString() || null, formData.get('description_en')?.toString() || null, formData.get('description_bm')?.toString() || null, formData.get('description_zh')?.toString() || null, Number(formData.get('display_order') || 0), formData.get('featured') ? 1 : 0, formData.get('status') === 'off' ? 0 : 1);
    revalidatePath('/[lang]/brands', 'page');
    revalidatePath('/[lang]', 'page');
}
export async function updateBrandAction(id: number, formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare(`UPDATE brands SET
       name_en = ?, name_bm = ?, name_zh = ?, logo = ?,
       description_en = ?, description_bm = ?, description_zh = ?,
       display_order = ?, featured = ?, status = ?,
       updated_at = datetime('now')
     WHERE id = ?`).run(formData.get('name_en')?.toString() || '', formData.get('name_bm')?.toString() || null, formData.get('name_zh')?.toString() || null, formData.get('logo')?.toString() || null, formData.get('description_en')?.toString() || null, formData.get('description_bm')?.toString() || null, formData.get('description_zh')?.toString() || null, Number(formData.get('display_order') || 0), formData.get('featured') ? 1 : 0, formData.get('status') === 'off' ? 0 : 1, id);
    revalidatePath('/[lang]/brands', 'page');
    revalidatePath('/[lang]', 'page');
}
export async function deleteBrandAction(id: number): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare('DELETE FROM brands WHERE id = ?').run(id);
    revalidatePath('/[lang]/brands', 'page');
    revalidatePath('/[lang]', 'page');
}
/* ============================================================
 * CATEGORIES
 * ============================================================ */
async function uniqueCategorySlug(slug: string): Promise<string> {
    let s = slug;
    let i = 2;
    while (await db.prepare('SELECT id FROM categories WHERE slug = ?').get(s)) {
        s = `${slug}-${i}`;
        i++;
    }
    return s;
}
export async function createCategoryAction(formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    const name_en = formData.get('name_en')?.toString().trim() ?? '';
    if (!name_en)
        return;
    const slug = await uniqueCategorySlug(slugify(name_en));
    await db.prepare(`INSERT INTO categories (slug, name_en, name_bm, name_zh, parent_id, icon, display_order, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(slug, name_en, formData.get('name_bm')?.toString() || null, formData.get('name_zh')?.toString() || null, Number(formData.get('parent_id') || 0) || null, formData.get('icon')?.toString() || null, Number(formData.get('display_order') || 0), formData.get('status') === 'off' ? 0 : 1);
    revalidatePath('/admin/categories');
}
export async function updateCategoryAction(id: number, formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare(`UPDATE categories SET name_en = ?, name_bm = ?, name_zh = ?, parent_id = ?, display_order = ?, status = ? WHERE id = ?`).run(formData.get('name_en')?.toString() || '', formData.get('name_bm')?.toString() || null, formData.get('name_zh')?.toString() || null, Number(formData.get('parent_id') || 0) || null, Number(formData.get('display_order') || 0), formData.get('status') === 'off' ? 0 : 1, id);
    revalidatePath('/admin/categories');
}
export async function deleteCategoryAction(id: number): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    revalidatePath('/admin/categories');
}
/* ============================================================
 * PRODUCTS
 * ============================================================ */
async function uniqueProductSlug(slug: string): Promise<string> {
    let s = slug;
    let i = 2;
    while (await db.prepare('SELECT id FROM products WHERE slug = ?').get(s)) {
        s = `${slug}-${i}`;
        i++;
    }
    return s;
}
function numOrNull(v: FormDataEntryValue | null) {
    if (!v)
        return null;
    const s = v.toString();
    if (s === '')
        return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}
async function writePriceHistory(productId: number, adminId: number, before: any, after: any) {
    const fields: Array<[
        'retail_price' | 'wholesale_price' | 'promotion_price',
        number | null,
        number | null
    ]> = [
        ['retail_price', before.retail_price, after.retail_price],
        ['wholesale_price', before.wholesale_price, after.wholesale_price],
        ['promotion_price', before.promotion_price, after.promotion_price],
    ];
    const stmt = db.prepare(`INSERT INTO price_history (product_id, price_type, old_price, new_price, changed_by)
     VALUES (?, ?, ?, ?, ?)`);
    for (const [type, oldV, newV] of fields) {
        if ((oldV ?? null) !== (newV ?? null)) {
            stmt.run(productId, type, oldV, newV, adminId);
        }
    }
}
export async function createProductAction(formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    const name_en = formData.get('name_en')?.toString().trim() ?? '';
    if (!name_en)
        return;
    const slug = await uniqueProductSlug(slugify(name_en));
    const info = await db.prepare(`INSERT INTO products (slug, sku, name_en, name_bm, name_zh, brand_id, category_id, model, capacity, product_type,
       description_en, description_bm, description_zh, specifications,
       stock_status, retail_price, wholesale_price, promotion_price, price_min, price_max, currency, price_display_mode,
       featured, status, seo_title_en, seo_description_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(slug, formData.get('sku')?.toString() || null, name_en, formData.get('name_bm')?.toString() || null, formData.get('name_zh')?.toString() || null, Number(formData.get('brand_id') || 0) || null, Number(formData.get('category_id') || 0) || null, formData.get('model')?.toString() || null, formData.get('capacity')?.toString() || null, formData.get('product_type')?.toString() || null, formData.get('description_en')?.toString() || null, formData.get('description_bm')?.toString() || null, formData.get('description_zh')?.toString() || null, formData.get('specifications')?.toString() || null, formData.get('stock_status')?.toString() || 'in_stock', numOrNull(formData.get('retail_price')), numOrNull(formData.get('wholesale_price')), numOrNull(formData.get('promotion_price')), numOrNull(formData.get('price_min')), numOrNull(formData.get('price_max')), formData.get('currency')?.toString() || 'RM', formData.get('price_display_mode')?.toString() || 'SHOW_PRICE', formData.get('featured') ? 1 : 0, formData.get('status') === 'off' ? 0 : 1, formData.get('seo_title_en')?.toString() || null, formData.get('seo_description_en')?.toString() || null);
    revalidatePath('/[lang]/products', 'page');
    revalidatePath('/[lang]', 'page');
}
export async function updateProductAction(id: number, formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    // Snapshot old prices for history
    const before = await db.prepare('SELECT retail_price, wholesale_price, promotion_price FROM products WHERE id = ?').get(id) as {
        retail_price: number | null;
        wholesale_price: number | null;
        promotion_price: number | null;
    } | undefined;
    await db.prepare(`UPDATE products SET
       sku = ?, name_en = ?, name_bm = ?, name_zh = ?, brand_id = ?, category_id = ?,
       model = ?, capacity = ?, product_type = ?,
       description_en = ?, description_bm = ?, description_zh = ?,
       specifications = ?, stock_status = ?,
       retail_price = ?, wholesale_price = ?, promotion_price = ?,
       price_min = ?, price_max = ?, currency = ?, price_display_mode = ?,
       featured = ?, status = ?,
       seo_title_en = ?, seo_description_en = ?,
       updated_at = datetime('now')
     WHERE id = ?`).run(formData.get('sku')?.toString() || null, formData.get('name_en')?.toString() || '', formData.get('name_bm')?.toString() || null, formData.get('name_zh')?.toString() || null, Number(formData.get('brand_id') || 0) || null, Number(formData.get('category_id') || 0) || null, formData.get('model')?.toString() || null, formData.get('capacity')?.toString() || null, formData.get('product_type')?.toString() || null, formData.get('description_en')?.toString() || null, formData.get('description_bm')?.toString() || null, formData.get('description_zh')?.toString() || null, formData.get('specifications')?.toString() || null, formData.get('stock_status')?.toString() || 'in_stock', numOrNull(formData.get('retail_price')), numOrNull(formData.get('wholesale_price')), numOrNull(formData.get('promotion_price')), numOrNull(formData.get('price_min')), numOrNull(formData.get('price_max')), formData.get('currency')?.toString() || 'RM', formData.get('price_display_mode')?.toString() || 'SHOW_PRICE', formData.get('featured') ? 1 : 0, formData.get('status') === 'off' ? 0 : 1, formData.get('seo_title_en')?.toString() || null, formData.get('seo_description_en')?.toString() || null, id);
    const after = {
        retail_price: numOrNull(formData.get('retail_price')),
        wholesale_price: numOrNull(formData.get('wholesale_price')),
        promotion_price: numOrNull(formData.get('promotion_price')),
    };
    await writePriceHistory(id, admin.id, before ?? { retail_price: null, wholesale_price: null, promotion_price: null }, after);
    revalidatePath('/[lang]/products', 'page');
    revalidatePath('/[lang]', 'page');
    revalidatePath(`/[lang]/products/${formData.get('slug')}`, 'page');
}
export async function deleteProductAction(id: number): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare('DELETE FROM products WHERE id = ?').run(id);
    revalidatePath('/[lang]/products', 'page');
    revalidatePath('/[lang]', 'page');
}
export async function duplicateProductAction(id: number): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    const row = await db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!row)
        return;
    const newSlug = await uniqueProductSlug(`${row.slug}-copy`);
    await db.prepare(`INSERT INTO products (slug, sku, name_en, name_bm, name_zh, brand_id, category_id, model, capacity, product_type,
       description_en, description_bm, description_zh, specifications,
       stock_status, retail_price, wholesale_price, promotion_price, price_min, price_max, currency, price_display_mode,
       featured, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(newSlug, row.sku, `${row.name_en} (Copy)`, row.name_bm, row.name_zh, row.brand_id, row.category_id, row.model, row.capacity, row.product_type, row.description_en, row.description_bm, row.description_zh, row.specifications, row.stock_status, row.retail_price, row.wholesale_price, row.promotion_price, row.price_min, row.price_max, row.currency, row.price_display_mode, 0, row.status);
    revalidatePath('/[lang]/products', 'page');
    revalidatePath('/[lang]', 'page');
}
/* ----- Product media actions ----- */
export async function addProductMediaAction(productId: number, formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    const url = formData.get('url')?.toString() ?? '';
    const type = formData.get('type')?.toString() === 'video' ? 'video' : 'image';
    const alt = formData.get('alt_text')?.toString() || null;
    const isPrimary = formData.get('is_primary') ? 1 : 0;
    if (!url)
        return;
    // If primary, unmark others
    if (isPrimary) {
        await db.prepare('UPDATE product_media SET is_primary = 0 WHERE product_id = ?').run(productId);
    }
    await db.prepare(`INSERT INTO product_media (product_id, type, url, alt_text, display_order, is_primary, is_featured)
     VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM product_media WHERE product_id = ?), ?, 0)`).run(productId, type, url, alt, productId, isPrimary);
    revalidatePath('/admin/products');
}
export async function deleteProductMediaAction(mediaId: number): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare('DELETE FROM product_media WHERE id = ?').run(mediaId);
    revalidatePath('/admin/products');
}
export async function setPrimaryMediaAction(mediaId: number, productId: number): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare('UPDATE product_media SET is_primary = 0 WHERE product_id = ?').run(productId);
    await db.prepare('UPDATE product_media SET is_primary = 1 WHERE id = ?').run(mediaId);
    revalidatePath('/admin/products');
}
export async function reorderProductMediaAction(productId: number, orderedIds: number[]): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    const stmt = db.prepare('UPDATE product_media SET display_order = ? WHERE id = ? AND product_id = ?');
    for (let idx = 0; idx < orderedIds.length; idx++) {
        await stmt.run(idx + 1, orderedIds[idx], productId);
    }
    revalidatePath('/admin/products');
}
export async function getProductMediaAction(productId: number): Promise<ProductMedia[]> {
    const admin = await getCurrentAdmin();
    if (!admin)
        return [];
    return await db
        .prepare('SELECT * FROM product_media WHERE product_id = ? ORDER BY display_order ASC')
        .all(productId) as ProductMedia[];
}
/* ----- Product album (photos) actions — used by ProductAlbumManager ----- */
export async function addProductPhotosAction(
    productId: number,
    photos: { url: string; alt_text: string | null }[],
    makeCover: boolean
): Promise<{ ok: boolean; added?: number; error?: string }> {
    const admin = await getCurrentAdmin();
    if (!admin) return { ok: false, error: 'Unauthorized' };
    if (!photos || photos.length === 0) return { ok: true, added: 0 };
    try {
        const existing = (await db
            .prepare('SELECT COUNT(*) as c FROM product_media WHERE product_id = ? AND type != ?')
            .get(productId, 'video')) as { c: number };
        const hadPhotos = (existing?.c ?? 0) > 0;
        const stmt = db.prepare(
            `INSERT INTO product_media (product_id, type, url, alt_text, display_order, is_primary, is_featured)
             VALUES (?, 'image', ?, ?, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM product_media WHERE product_id = ?), ?, 0)`
        );
        let first = true;
        for (const p of photos) {
            // First uploaded photo becomes the cover when the album had none.
            const isCover = makeCover || (!hadPhotos && first) ? 1 : 0;
            if (isCover) {
                await db.prepare('UPDATE product_media SET is_primary = 0 WHERE product_id = ?').run(productId);
            }
            await stmt.run(productId, p.url, p.alt_text ?? null, productId, isCover);
            first = false;
        }
        revalidatePath('/admin/products');
        revalidatePath('/[lang]/products', 'page');
        revalidatePath('/[lang]', 'page');
        return { ok: true, added: photos.length };
    } catch (e: any) {
        return { ok: false, error: e?.message ?? 'Failed to add photos' };
    }
}

export async function updateProductMediaOrder(
    productId: number,
    orderedIds: number[]
): Promise<{ ok: boolean; error?: string }> {
    const admin = await getCurrentAdmin();
    if (!admin) return { ok: false, error: 'Unauthorized' };
    try {
        const stmt = db.prepare('UPDATE product_media SET display_order = ? WHERE id = ? AND product_id = ?');
        for (let idx = 0; idx < orderedIds.length; idx++) {
            await stmt.run(idx + 1, orderedIds[idx], productId);
        }
        revalidatePath('/admin/products');
        revalidatePath('/[lang]/products', 'page');
        revalidatePath('/[lang]', 'page');
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e?.message ?? 'Failed to reorder' };
    }
}

export async function setProductMediaCover(
    mediaId: number,
    productId: number
): Promise<{ ok: boolean; error?: string }> {
    const admin = await getCurrentAdmin();
    if (!admin) return { ok: false, error: 'Unauthorized' };
    try {
        await db.prepare('UPDATE product_media SET is_primary = 0 WHERE product_id = ?').run(productId);
        await db.prepare('UPDATE product_media SET is_primary = 1 WHERE id = ?').run(mediaId);
        revalidatePath('/admin/products');
        revalidatePath('/[lang]/products', 'page');
        revalidatePath('/[lang]', 'page');
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e?.message ?? 'Failed to set cover' };
    }
}
/* ============================================================
 * LOCATIONS
 * ============================================================ */
async function uniqueLocationSlug(slug: string): Promise<string> {
    let s = slug;
    let i = 2;
    while (await db.prepare('SELECT id FROM locations WHERE slug = ?').get(s)) {
        s = `${slug}-${i}`;
        i++;
    }
    return s;
}
export async function createLocationAction(formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    const name_en = formData.get('name_en')?.toString().trim() ?? '';
    if (!name_en)
        return;
    const slug = await uniqueLocationSlug(slugify(name_en));
    await db.prepare(`INSERT INTO locations (slug, name_en, name_bm, name_zh, type, is_hq, address, city, state, postal_code,
       country, telephone, whatsapp, email, opening_hours, google_maps_url, google_maps_place_id, latitude, longitude,
       photo_url, description_en, description_bm, description_zh, display_order, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(slug, name_en, formData.get('name_bm')?.toString() || null, formData.get('name_zh')?.toString() || null, formData.get('type')?.toString() || 'branch', formData.get('is_hq') ? 1 : 0, formData.get('address')?.toString() || null, formData.get('city')?.toString() || null, formData.get('state')?.toString() || null, formData.get('postal_code')?.toString() || null, formData.get('country')?.toString() || 'Malaysia', formData.get('telephone')?.toString() || null, formData.get('whatsapp')?.toString() || null, formData.get('email')?.toString() || null, formData.get('opening_hours')?.toString() || null, formData.get('google_maps_url')?.toString() || null, formData.get('google_maps_place_id')?.toString() || null, numOrNull(formData.get('latitude')), numOrNull(formData.get('longitude')), formData.get('photo_url')?.toString() || null, formData.get('description_en')?.toString() || null, formData.get('description_bm')?.toString() || null, formData.get('description_zh')?.toString() || null, Number(formData.get('display_order') || 0), formData.get('status') === 'off' ? 0 : 1);
    revalidatePath('/admin/locations');
    revalidatePath('/[lang]/locations', 'page');
    revalidatePath('/[lang]', 'page');
}
export async function updateLocationAction(id: number, formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare(`UPDATE locations SET
       name_en = ?, name_bm = ?, name_zh = ?, type = ?, is_hq = ?,
       address = ?, city = ?, state = ?, postal_code = ?, country = ?,
       telephone = ?, whatsapp = ?, email = ?, opening_hours = ?,
       google_maps_url = ?, google_maps_place_id = ?, latitude = ?, longitude = ?,
       photo_url = ?, description_en = ?, description_bm = ?, description_zh = ?,
       display_order = ?, status = ?,
       updated_at = datetime('now')
     WHERE id = ?`).run(formData.get('name_en')?.toString() || '', formData.get('name_bm')?.toString() || null, formData.get('name_zh')?.toString() || null, formData.get('type')?.toString() || 'branch', formData.get('is_hq') ? 1 : 0, formData.get('address')?.toString() || null, formData.get('city')?.toString() || null, formData.get('state')?.toString() || null, formData.get('postal_code')?.toString() || null, formData.get('country')?.toString() || 'Malaysia', formData.get('telephone')?.toString() || null, formData.get('whatsapp')?.toString() || null, formData.get('email')?.toString() || null, formData.get('opening_hours')?.toString() || null, formData.get('google_maps_url')?.toString() || null, formData.get('google_maps_place_id')?.toString() || null, numOrNull(formData.get('latitude')), numOrNull(formData.get('longitude')), formData.get('photo_url')?.toString() || null, formData.get('description_en')?.toString() || null, formData.get('description_bm')?.toString() || null, formData.get('description_zh')?.toString() || null, Number(formData.get('display_order') || 0), formData.get('status') === 'off' ? 0 : 1, id);
    revalidatePath('/admin/locations');
    revalidatePath('/[lang]/locations', 'page');
    revalidatePath('/[lang]', 'page');
}
export async function deleteLocationAction(id: number): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare('DELETE FROM locations WHERE id = ?').run(id);
    revalidatePath('/[lang]/locations', 'page');
    revalidatePath('/[lang]', 'page');
}
/* ============================================================
 * TECHNICAL PARTNERS
 * ============================================================ */
async function uniquePartnerSlug(slug: string): Promise<string> {
    let s = slug;
    let i = 2;
    while (await db.prepare('SELECT id FROM technical_partners WHERE slug = ?').get(s)) {
        s = `${slug}-${i}`;
        i++;
    }
    return s;
}
export async function createPartnerAction(formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    const name_en = formData.get('company_name_en')?.toString().trim() ?? '';
    if (!name_en)
        return;
    const slug = await uniquePartnerSlug(slugify(name_en));
    await db.prepare(`INSERT INTO technical_partners (slug, company_name_en, company_name_bm, company_name_zh,
       contact_person, telephone, whatsapp, email, address, city, state, country,
       service_area, service_types, logo_url, photo_url,
       description_en, description_bm, description_zh, website, facebook, google_maps_url,
       display_order, featured, status,
       show_phone, show_whatsapp, show_email, show_address, show_website)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(slug, name_en, formData.get('company_name_bm')?.toString() || null, formData.get('company_name_zh')?.toString() || null, formData.get('contact_person')?.toString() || null, formData.get('telephone')?.toString() || null, formData.get('whatsapp')?.toString() || null, formData.get('email')?.toString() || null, formData.get('address')?.toString() || null, formData.get('city')?.toString() || null, formData.get('state')?.toString() || null, formData.get('country')?.toString() || 'Malaysia', formData.get('service_area')?.toString() || null, formData.get('service_types')?.toString() || null, formData.get('logo_url')?.toString() || null, formData.get('photo_url')?.toString() || null, formData.get('description_en')?.toString() || null, formData.get('description_bm')?.toString() || null, formData.get('description_zh')?.toString() || null, formData.get('website')?.toString() || null, formData.get('facebook')?.toString() || null, formData.get('google_maps_url')?.toString() || null, Number(formData.get('display_order') || 0), formData.get('featured') ? 1 : 0, formData.get('status') === 'off' ? 0 : 1, formData.get('show_phone') === 'off' ? 0 : 1, formData.get('show_whatsapp') === 'off' ? 0 : 1, formData.get('show_email') === 'off' ? 0 : 1, formData.get('show_address') === 'off' ? 0 : 1, formData.get('show_website') === 'off' ? 0 : 1);
    revalidatePath('/[lang]/technical-partners', 'page');
}
export async function updatePartnerAction(id: number, formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare(`UPDATE technical_partners SET
       company_name_en = ?, company_name_bm = ?, company_name_zh = ?,
       contact_person = ?, telephone = ?, whatsapp = ?, email = ?,
       address = ?, city = ?, state = ?, country = ?,
       service_area = ?, service_types = ?, logo_url = ?, photo_url = ?,
       description_en = ?, description_bm = ?, description_zh = ?,
       website = ?, facebook = ?, google_maps_url = ?,
       display_order = ?, featured = ?, status = ?,
       show_phone = ?, show_whatsapp = ?, show_email = ?, show_address = ?, show_website = ?,
       updated_at = datetime('now')
     WHERE id = ?`).run(formData.get('company_name_en')?.toString() || '', formData.get('company_name_bm')?.toString() || null, formData.get('company_name_zh')?.toString() || null, formData.get('contact_person')?.toString() || null, formData.get('telephone')?.toString() || null, formData.get('whatsapp')?.toString() || null, formData.get('email')?.toString() || null, formData.get('address')?.toString() || null, formData.get('city')?.toString() || null, formData.get('state')?.toString() || null, formData.get('country')?.toString() || 'Malaysia', formData.get('service_area')?.toString() || null, formData.get('service_types')?.toString() || null, formData.get('logo_url')?.toString() || null, formData.get('photo_url')?.toString() || null, formData.get('description_en')?.toString() || null, formData.get('description_bm')?.toString() || null, formData.get('description_zh')?.toString() || null, formData.get('website')?.toString() || null, formData.get('facebook')?.toString() || null, formData.get('google_maps_url')?.toString() || null, Number(formData.get('display_order') || 0), formData.get('featured') ? 1 : 0, formData.get('status') === 'off' ? 0 : 1, formData.get('show_phone') === 'off' ? 0 : 1, formData.get('show_whatsapp') === 'off' ? 0 : 1, formData.get('show_email') === 'off' ? 0 : 1, formData.get('show_address') === 'off' ? 0 : 1, formData.get('show_website') === 'off' ? 0 : 1, id);
    revalidatePath('/[lang]/technical-partners', 'page');
}
export async function deletePartnerAction(id: number): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare('DELETE FROM technical_partners WHERE id = ?').run(id);
    revalidatePath('/[lang]/technical-partners', 'page');
}
/* ============================================================
 * FAQ
 * ============================================================ */
export async function createFaqAction(formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    const q_en = formData.get('question_en')?.toString().trim() ?? '';
    const a_en = formData.get('answer_en')?.toString().trim() ?? '';
    if (!q_en || !a_en)
        return;
    await db.prepare(`INSERT INTO faqs (category, question_en, question_bm, question_zh, answer_en, answer_bm, answer_zh, display_order, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(formData.get('category')?.toString() || null, q_en, formData.get('question_bm')?.toString() || null, formData.get('question_zh')?.toString() || null, a_en, formData.get('answer_bm')?.toString() || null, formData.get('answer_zh')?.toString() || null, Number(formData.get('display_order') || 0), formData.get('status') === 'off' ? 0 : 1);
}
export async function updateFaqAction(id: number, formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare(`UPDATE faqs SET category = ?, question_en = ?, question_bm = ?, question_zh = ?,
       answer_en = ?, answer_bm = ?, answer_zh = ?, display_order = ?, status = ? WHERE id = ?`).run(formData.get('category')?.toString() || null, formData.get('question_en')?.toString() || '', formData.get('question_bm')?.toString() || null, formData.get('question_zh')?.toString() || null, formData.get('answer_en')?.toString() || '', formData.get('answer_bm')?.toString() || null, formData.get('answer_zh')?.toString() || null, Number(formData.get('display_order') || 0), formData.get('status') === 'off' ? 0 : 1, id);
}
export async function deleteFaqAction(id: number): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare('DELETE FROM faqs WHERE id = ?').run(id);
}
/* ============================================================
 * ENQUIRIES (admin)
 * ============================================================ */
export async function updateEnquiryStatusAction(id: number, formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    const status = formData.get('status')?.toString() ?? 'NEW';
    await db.prepare('UPDATE enquiries SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);
}
export async function deleteEnquiryAction(id: number): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    await db.prepare('DELETE FROM enquiries WHERE id = ?').run(id);
}
/* ============================================================
 * SETTINGS
 * ============================================================ */
export async function saveSettingsAction(formData: FormData): Promise<{
    ok: boolean;
}> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    const settings: Record<string, string> = {};
    for (const [k, v] of formData.entries()) {
        if (typeof v === 'string')
            settings[k] = v;
    }
    await setManySettings(settings);
    revalidatePath('/', 'layout');
    return { ok: true };
}
/* ============================================================
 * HOMEPAGE CONTENT
 * ============================================================ */
export async function upsertHomepageSectionAction(formData: FormData): Promise<void> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    const key = formData.get('section_key')?.toString();
    if (!key)
        return;
    await db.prepare(`INSERT INTO homepage_content (section_key, enabled, title_en, title_bm, title_zh,
       subtitle_en, subtitle_bm, subtitle_zh, body_en, body_bm, body_zh,
       image_url, video_url, cta_label_en, cta_label_bm, cta_label_zh, cta_url, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(section_key) DO UPDATE SET
       enabled = excluded.enabled,
       title_en = excluded.title_en, title_bm = excluded.title_bm, title_zh = excluded.title_zh,
       subtitle_en = excluded.subtitle_en, subtitle_bm = excluded.subtitle_bm, subtitle_zh = excluded.subtitle_zh,
       body_en = excluded.body_en, body_bm = excluded.body_bm, body_zh = excluded.body_zh,
       image_url = excluded.image_url, video_url = excluded.video_url,
       cta_label_en = excluded.cta_label_en, cta_label_bm = excluded.cta_label_bm, cta_label_zh = excluded.cta_label_zh,
       cta_url = excluded.cta_url, display_order = excluded.display_order,
       updated_at = datetime('now')`).run(key, formData.get('enabled') ? 1 : 0, formData.get('title_en')?.toString() || null, formData.get('title_bm')?.toString() || null, formData.get('title_zh')?.toString() || null, formData.get('subtitle_en')?.toString() || null, formData.get('subtitle_bm')?.toString() || null, formData.get('subtitle_zh')?.toString() || null, formData.get('body_en')?.toString() || null, formData.get('body_bm')?.toString() || null, formData.get('body_zh')?.toString() || null, formData.get('image_url')?.toString() || null, formData.get('video_url')?.toString() || null, formData.get('cta_label_en')?.toString() || null, formData.get('cta_label_bm')?.toString() || null, formData.get('cta_label_zh')?.toString() || null, formData.get('cta_url')?.toString() || null, Number(formData.get('display_order') || 0));
    revalidatePath('/[lang]', 'page');
}
/* ============================================================
 * ADMIN USER CREATION
 * ============================================================ */
export async function createAdminAction(formData: FormData): Promise<{
    ok: boolean;
    error?: string;
}> {
    const admin = await getCurrentAdmin();
    if (!admin)
        redirect('/admin/login');
    const email = formData.get('email')?.toString().trim().toLowerCase() ?? '';
    const password = formData.get('password')?.toString() ?? '';
    const name = formData.get('name')?.toString() || 'Admin';
    if (!email || !password)
        return { ok: false, error: 'Email and password required' };
    const exists = await db.prepare('SELECT id FROM admin_users WHERE email = ?').get(email);
    if (exists)
        return { ok: false, error: 'Email already exists' };
    const hash = await bcrypt.hash(password, 10);
    await db.prepare('INSERT INTO admin_users (email, name, password_hash, role) VALUES (?, ?, ?, ?)').run(email, name, hash, 'admin');
    return { ok: true };
}

/* ============================================================
 * CHANGE OWN PASSWORD (self-service, any authenticated admin)
 * ============================================================ */
export async function changePasswordAction(formData: FormData): Promise<{
    ok: boolean;
    error?: string;
}> {
    const admin = await getCurrentAdmin();
    if (!admin) redirect('/admin/login');

    const current = formData.get('current_password')?.toString() ?? '';
    const next = formData.get('new_password')?.toString() ?? '';
    const confirm = formData.get('confirm_password')?.toString() ?? '';

    if (!current || !next || !confirm)
        return { ok: false, error: 'All fields are required.' };
    if (next.length < 8)
        return { ok: false, error: 'New password must be at least 8 characters.' };
    if (next !== confirm)
        return { ok: false, error: 'New password and confirmation do not match.' };

    const row = (await db
        .prepare('SELECT id, password_hash FROM admin_users WHERE id = ?')
        .get(admin.id)) as { id: number; password_hash: string } | undefined;
    if (!row) return { ok: false, error: 'Account not found.' };

    const valid = await bcrypt.compare(current, row.password_hash);
    if (!valid) return { ok: false, error: 'Current password is incorrect.' };

    const hash = await bcrypt.hash(next, 10);
    await db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(hash, admin.id);
    return { ok: true };
}

/* ============================================================
 * ABOUT US — "Our Story" (rich text) + photo gallery
 * ============================================================ */
export async function getAboutStoryAction(): Promise<AboutContent | null> {
    return (
        (await db
            .prepare("SELECT * FROM about_content WHERE section_key = 'story' LIMIT 1")
            .get()) as AboutContent | undefined
    ) ?? null;
}

export async function saveAboutStoryAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
    const admin = await getCurrentAdmin();
    if (!admin) return { ok: false, error: 'Unauthorized' };
    try {
        const title_en = formData.get('title_en')?.toString() || null;
        const title_bm = formData.get('title_bm')?.toString() || null;
        const title_zh = formData.get('title_zh')?.toString() || null;
        const body_en = formData.get('body_en')?.toString() || null;
        const body_bm = formData.get('body_bm')?.toString() || null;
        const body_zh = formData.get('body_zh')?.toString() || null;
        await db
            .prepare(
                `INSERT INTO about_content (section_key, title_en, title_bm, title_zh, body_en, body_bm, body_zh, updated_at)
                 VALUES ('story', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(section_key) DO UPDATE SET
                   title_en = excluded.title_en, title_bm = excluded.title_bm, title_zh = excluded.title_zh,
                   body_en = excluded.body_en, body_bm = excluded.body_bm, body_zh = excluded.body_zh,
                   updated_at = CURRENT_TIMESTAMP`
            )
            .run(title_en, title_bm, title_zh, body_en, body_bm, body_zh);
        revalidatePath('/[lang]/about', 'page');
        revalidatePath('/admin/about');
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e?.message ?? 'Failed to save story' };
    }
}

export async function listAboutPhotosAction(): Promise<AboutPhoto[]> {
    return (await db
        .prepare('SELECT * FROM about_gallery ORDER BY is_primary DESC, display_order ASC')
        .all()) as AboutPhoto[];
}

export async function addAboutPhotosAction(
    photos: { url: string; file_name: string | null; alt_text: string | null }[],
    makeCover: boolean
): Promise<{ ok: boolean; added?: number; error?: string }> {
    const admin = await getCurrentAdmin();
    if (!admin) return { ok: false, error: 'Unauthorized' };
    if (!photos || photos.length === 0) return { ok: true, added: 0 };
    try {
        const existing = (await db.prepare('SELECT COUNT(*) as c FROM about_gallery').get()) as { c: number };
        const hadPhotos = (existing?.c ?? 0) > 0;
        const stmt = db.prepare(
            `INSERT INTO about_gallery (url, file_name, alt_text, display_order, is_primary)
             VALUES (?, ?, ?, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM about_gallery), ?)`
        );
        let first = true;
        for (const p of photos) {
            const isCover = makeCover || (!hadPhotos && first) ? 1 : 0;
            if (isCover) {
                await db.prepare('UPDATE about_gallery SET is_primary = 0').run();
            }
            await stmt.run(p.url, p.file_name ?? null, p.alt_text ?? null, isCover);
            first = false;
        }
        revalidatePath('/admin/about');
        revalidatePath('/[lang]/about', 'page');
        return { ok: true, added: photos.length };
    } catch (e: any) {
        return { ok: false, error: e?.message ?? 'Failed to add photos' };
    }
}

export async function deleteAboutPhotoAction(id: number): Promise<{ ok: boolean; error?: string }> {
    const admin = await getCurrentAdmin();
    if (!admin) return { ok: false, error: 'Unauthorized' };
    try {
        await db.prepare('DELETE FROM about_gallery WHERE id = ?').run(id);
        revalidatePath('/admin/about');
        revalidatePath('/[lang]/about', 'page');
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e?.message ?? 'Failed to delete photo' };
    }
}

export async function setAboutCoverAction(id: number): Promise<{ ok: boolean; error?: string }> {
    const admin = await getCurrentAdmin();
    if (!admin) return { ok: false, error: 'Unauthorized' };
    try {
        await db.prepare('UPDATE about_gallery SET is_primary = 0').run();
        await db.prepare('UPDATE about_gallery SET is_primary = 1 WHERE id = ?').run(id);
        revalidatePath('/admin/about');
        revalidatePath('/[lang]/about', 'page');
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e?.message ?? 'Failed to set cover' };
    }
}

export async function reorderAboutPhotosAction(orderedIds: number[]): Promise<{ ok: boolean; error?: string }> {
    const admin = await getCurrentAdmin();
    if (!admin) return { ok: false, error: 'Unauthorized' };
    try {
        const stmt = db.prepare('UPDATE about_gallery SET display_order = ? WHERE id = ?');
        for (let idx = 0; idx < orderedIds.length; idx++) {
            await stmt.run(idx + 1, orderedIds[idx]);
        }
        revalidatePath('/admin/about');
        revalidatePath('/[lang]/about', 'page');
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e?.message ?? 'Failed to reorder' };
    }
}
