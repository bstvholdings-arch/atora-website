/**
 * Repository layer — typed queries against the PostgreSQL DB.
 * Centralised so all server components share consistent shape.
 * All methods are async (await the underlying pg connection).
 */
import db, {
  Brand,
  Category,
  Product,
  ProductMedia,
  Enquiry,
  FAQ,
  Location,
  TechnicalPartner,
  HomepageContent,
  SiteSetting,
  AboutContent,
  AboutPhoto,
  Award,
  AwardMedia,
  GalleryItem,
  Comment,
  PublicComment,
} from './db';

const SQL = {
  activeBrands: `SELECT * FROM brands WHERE status = 1 ORDER BY display_order, name_en`,
  featuredBrands: `SELECT * FROM brands WHERE status = 1 AND featured = 1 ORDER BY display_order, name_en`,
  brandBySlug: `SELECT * FROM brands WHERE slug = ? AND status = 1`,
  brandProducts: `SELECT * FROM products WHERE brand_id = ? AND status = 1 ORDER BY featured DESC, name_en`,

  activeCategories: `SELECT * FROM categories WHERE status = 1 ORDER BY display_order, name_en`,
  categoryBySlug: `SELECT * FROM categories WHERE slug = ? AND status = 1`,

  // Products
  activeProducts: `SELECT * FROM products WHERE status = 1 ORDER BY featured DESC, created_at DESC`,
  featuredProducts: `SELECT * FROM products WHERE status = 1 AND featured = 1 ORDER BY created_at DESC LIMIT ?`,
  productBySlug: `SELECT * FROM products WHERE slug = ? AND status = 1`,

  productMedia: `SELECT * FROM product_media WHERE product_id = ? ORDER BY is_primary DESC, display_order`,
  productMediaAll: `SELECT * FROM product_media WHERE product_id = ? ORDER BY is_primary DESC, display_order`,

  // Enquiries
  enquiriesAll: `SELECT * FROM enquiries ORDER BY created_at DESC`,
  enquiriesByStatus: `SELECT * FROM enquiries WHERE status = ? ORDER BY created_at DESC`,
  enquiryById: `SELECT * FROM enquiries WHERE id = ?`,

  // Locations
  activeLocations: `SELECT * FROM locations WHERE status = 1 ORDER BY display_order`,
  hqLocation: `SELECT * FROM locations WHERE is_hq = 1 AND status = 1 LIMIT 1`,
  locationBySlug: `SELECT * FROM locations WHERE slug = ? AND status = 1`,

  // FAQs
  activeFaqs: `SELECT * FROM faqs WHERE status = 1 ORDER BY display_order, id`,
  faqById: `SELECT * FROM faqs WHERE id = ?`,

  // Partners
  activePartners: `SELECT * FROM technical_partners WHERE status = 1 ORDER BY display_order, company_name_en`,
  featuredPartners: `SELECT * FROM technical_partners WHERE status = 1 AND featured = 1 ORDER BY display_order LIMIT ?`,
  partnerBySlug: `SELECT * FROM technical_partners WHERE slug = ? AND status = 1`,

  // Homepage content
  activeHomepageSections: `SELECT * FROM homepage_content WHERE enabled = 1 ORDER BY display_order`,

  // Site settings — handled in settings.ts
  allSettings: `SELECT key, value FROM site_settings`,
};

/**
 * Resolve a product's brand.
 *
 * A number of legacy product rows have `brand_id = NULL` even though the
 * product name starts with the brand name ("Daikin 2.0HP ..."). Fall back to a
 * case-insensitive prefix match against the real brand list. This never
 * invents a brand — it only links a product to a brand that already exists in
 * the database and is already named in the product title.
 */
/**
 * Effective parent category id.
 *
 * A large part of the seeded category rows have `parent_id = NULL` even though
 * their slug encodes the parent ("air-conditioners-wall-mounted" belongs to
 * "air-conditioners"). That left `/products` showing only the handful of rows
 * directly assigned to the group and the homepage rendering every category as a
 * top-level card.
 *
 * An admin-set `parent_id` always wins; the slug-derived parent is only a
 * fallback for rows where the hierarchy was never populated.
 */
export function effectiveParentId(category: Category, all: Category[]): number | null {
  if (category.parent_id != null) return category.parent_id;
  const candidates = all.filter(
    (o) => o.id !== category.id && o.slug && category.slug.startsWith(`${o.slug}-`)
  );
  if (candidates.length === 0) return null;
  // Longest matching prefix wins so "maintenance-products-cleaning-accessories"
  // maps to "maintenance-products", not to a shorter overlapping slug.
  candidates.sort((a, b) => b.slug.length - a.slug.length);
  return candidates[0].id;
}

/** All direct children of `parentId`, honouring the slug fallback. */
export function childCategoryIds(parentId: number, all: Category[]): number[] {
  return all.filter((c) => effectiveParentId(c, all) === parentId).map((c) => c.id);
}

export function resolveBrand(
  product: { brand_id?: number | null; name_en?: string | null; slug?: string | null },
  brands: Brand[]
): Brand | null {
  if (product.brand_id) {
    const byId = brands.find((b) => b.id === product.brand_id);
    if (byId) return byId;
  }
  const hay = (product.name_en || product.slug || '').toLowerCase().trim();
  if (!hay) return null;
  const matches = brands
    .filter((b) => b.name_en && hay.startsWith(b.name_en.toLowerCase()))
    .sort((a, b) => b.name_en.length - a.name_en.length);
  return matches[0] ?? null;
}

/** Copy the current cover media (or first media) onto awards.cover_image. */
export async function syncAwardCover(awardId: number): Promise<void> {
  const row = (await db
    .prepare(
      `SELECT file_path, thumb_path FROM award_media
       WHERE award_id = ? ORDER BY is_cover DESC, sort_order ASC, id ASC LIMIT 1`
    )
    .get(awardId)) as { file_path: string; thumb_path: string | null } | undefined;
  await db
    .prepare('UPDATE awards SET cover_image = ?, cover_thumb = ? WHERE id = ?')
    .run(row?.file_path ?? null, row?.thumb_path ?? null, awardId);
}

export const data = {
  // Brands
  async listActiveBrands(): Promise<Brand[]> {
    return (await db.prepare(SQL.activeBrands).all()) as Brand[];
  },
  async listFeaturedBrands(): Promise<Brand[]> {
    return (await db.prepare(SQL.featuredBrands).all()) as Brand[];
  },
  async getBrandBySlug(slug: string): Promise<Brand | null> {
    return (await db.prepare(SQL.brandBySlug).get(slug) as Brand | undefined) ?? null;
  },
  async listBrandProducts(brandId: number): Promise<Product[]> {
    return (await db.prepare(SQL.brandProducts).all(brandId)) as Product[];
  },

  // Categories
  async listActiveCategories(): Promise<Category[]> {
    return (await db.prepare(SQL.activeCategories).all()) as Category[];
  },
  async listCategoryGroups(): Promise<Category[]> {
    const all = (await db
      .prepare(`SELECT * FROM categories WHERE status = 1 ORDER BY display_order, name_en`)
      .all()) as Category[];
    // Top level = rows without an effective parent (see effectiveParentId).
    return all.filter((c) => effectiveParentId(c, all) === null);
  },
  /**
   * Direct children of a group. Falls back to slash/slug-derived hierarchy when
   * `parent_id` was never populated, so the catalogue never silently empties.
   */
  async listChildCategories(groupId: number): Promise<Category[]> {
    const all = (await db
      .prepare(`SELECT * FROM categories WHERE status = 1 ORDER BY display_order, name_en`)
      .all()) as Category[];
    const ids = new Set(childCategoryIds(groupId, all));
    return all.filter((c) => ids.has(c.id));
  },
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return (await db.prepare(SQL.categoryBySlug).get(slug) as Category | undefined) ?? null;
  },

  // Products
  async listActiveProducts(): Promise<Product[]> {
    return (await db.prepare(SQL.activeProducts).all()) as Product[];
  },
  async listFeaturedProducts(limit = 8): Promise<Product[]> {
    return (await db.prepare(SQL.featuredProducts).all(limit)) as Product[];
  },
  async getProductBySlug(slug: string): Promise<Product | null> {
    return (await db.prepare(SQL.productBySlug).get(slug) as Product | undefined) ?? null;
  },
  async listProductMedia(productId: number): Promise<ProductMedia[]> {
    return (await db.prepare(SQL.productMedia).all(productId)) as ProductMedia[];
  },
  async searchProducts(opts: {
    q?: string;
    brandId?: number;
    categoryId?: number;
    groupId?: number;
    groupIds?: number[];
  }): Promise<Product[]> {
    const where: string[] = ['status = 1'];
    const params: (string | number)[] = [];
    if (opts.q) {
      where.push('(name_en LIKE ? OR name_bm LIKE ? OR name_zh LIKE ? OR model LIKE ? OR sku LIKE ?)');
      const q = `%${opts.q}%`;
      params.push(q, q, q, q, q);
    }
    if (opts.brandId) {
      where.push('brand_id = ?');
      params.push(opts.brandId);
    }
    if (opts.categoryId) {
      where.push('category_id = ?');
      params.push(opts.categoryId);
    }
    // Expand groups in JS so the slug-derived hierarchy fallback is honoured.
    const allCategories = opts.groupId || (opts.groupIds && opts.groupIds.length > 0)
      ? (await db.prepare(`SELECT * FROM categories WHERE status = 1`).all())
      : [];
    if (opts.groupId) {
      const ids = [opts.groupId, ...childCategoryIds(opts.groupId, allCategories as Category[])];
      where.push(`(category_id IN (${ids.map(() => '?').join(',')}))`);
      params.push(...ids);
    }
    if (opts.groupIds && opts.groupIds.length > 0) {
      const ids = Array.from(
        new Set(
          opts.groupIds.flatMap((g) => [g, ...childCategoryIds(g, allCategories as Category[])])
        )
      );
      where.push(`(category_id IN (${ids.map(() => '?').join(',')}))`);
      params.push(...ids);
    }
    const sql = `SELECT * FROM products WHERE ${where.join(' AND ')} ORDER BY featured DESC, name_en LIMIT 200`;
    return (await db.prepare(sql).all(...params)) as Product[];
  },

  // About Us — "Our Story" (one row, section_key = 'story') + photo gallery
  async getAboutStory(): Promise<AboutContent | null> {
    return (
      (await db.prepare("SELECT * FROM about_content WHERE section_key = 'story' LIMIT 1").get()) as
        | AboutContent
        | undefined
    ) ?? null;
  },
  async listAboutPhotos(): Promise<AboutPhoto[]> {
    return (await db
      .prepare('SELECT * FROM about_gallery ORDER BY is_primary DESC, display_order ASC')
      .all()) as AboutPhoto[];
  },

  /* ==========================================================
   * AWARDS — medals / trophies shown on the About Us page
   * ========================================================== */

  /** Published awards, ordered for the Grid layout. */
  async listPublishedAwards(): Promise<Award[]> {
    return (await db
      .prepare('SELECT * FROM awards WHERE is_published = 1 ORDER BY sort_order ASC, id ASC')
      .all()) as Award[];
  },
  /** Every award including unpublished — admin only. */
  async listAllAwards(): Promise<Award[]> {
    return (await db
      .prepare('SELECT * FROM awards ORDER BY sort_order ASC, id ASC')
      .all()) as Award[];
  },
  /** Public lookup: only published rows are reachable from the front end. */
  async getPublishedAwardBySlug(slug: string): Promise<Award | null> {
    return (
      ((await db
        .prepare('SELECT * FROM awards WHERE slug = ? AND is_published = 1 LIMIT 1')
        .get(slug)) as Award | undefined) ?? null
    );
  },
  async getAwardById(id: number): Promise<Award | null> {
    return ((await db.prepare('SELECT * FROM awards WHERE id = ?').get(id)) as Award | undefined) ?? null;
  },
  async listAwardMedia(awardId: number): Promise<AwardMedia[]> {
    return (await db
      .prepare('SELECT * FROM award_media WHERE award_id = ? ORDER BY is_cover DESC, sort_order ASC, id ASC')
      .all(awardId)) as AwardMedia[];
  },
  /** All media keyed by award id — one query for the whole About page. */
  async listAllAwardMedia(): Promise<AwardMedia[]> {
    return (await db
      .prepare('SELECT * FROM award_media ORDER BY is_cover DESC, sort_order ASC, id ASC')
      .all()) as AwardMedia[];
  },
  async createAward(d: Partial<Award> & { title_en: string; slug: string }): Promise<number> {
    const info = await db
      .prepare(
        `INSERT INTO awards
           (slug, year, award_date, title_en, title_bm, title_zh,
            issuer_en, issuer_bm, issuer_zh, summary_en, summary_bm, summary_zh,
            story_en, story_bm, story_zh, cover_image, cover_thumb,
            seo_title_en, seo_title_bm, seo_title_zh,
            seo_desc_en, seo_desc_bm, seo_desc_zh,
            sort_order, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        d.slug,
        d.year ?? null,
        d.award_date ?? null,
        d.title_en,
        d.title_bm ?? null,
        d.title_zh ?? null,
        d.issuer_en ?? null,
        d.issuer_bm ?? null,
        d.issuer_zh ?? null,
        d.summary_en ?? null,
        d.summary_bm ?? null,
        d.summary_zh ?? null,
        d.story_en ?? null,
        d.story_bm ?? null,
        d.story_zh ?? null,
        d.cover_image ?? null,
        d.cover_thumb ?? null,
        d.seo_title_en ?? null,
        d.seo_title_bm ?? null,
        d.seo_title_zh ?? null,
        d.seo_desc_en ?? null,
        d.seo_desc_bm ?? null,
        d.seo_desc_zh ?? null,
        Number(d.sort_order ?? 0),
        d.is_published === 0 ? 0 : 1
      );
    return info.lastInsertRowid as number;
  },
  async updateAward(id: number, d: Partial<Award>): Promise<void> {
    await db
      .prepare(
        `UPDATE awards SET
           slug = ?, year = ?, award_date = ?,
           title_en = ?, title_bm = ?, title_zh = ?,
           issuer_en = ?, issuer_bm = ?, issuer_zh = ?,
           summary_en = ?, summary_bm = ?, summary_zh = ?,
           story_en = ?, story_bm = ?, story_zh = ?,
           cover_image = ?, cover_thumb = ?,
           seo_title_en = ?, seo_title_bm = ?, seo_title_zh = ?,
           seo_desc_en = ?, seo_desc_bm = ?, seo_desc_zh = ?,
           sort_order = ?, is_published = ?,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .run(
        d.slug ?? '',
        d.year ?? null,
        d.award_date ?? null,
        d.title_en ?? '',
        d.title_bm ?? null,
        d.title_zh ?? null,
        d.issuer_en ?? null,
        d.issuer_bm ?? null,
        d.issuer_zh ?? null,
        d.summary_en ?? null,
        d.summary_bm ?? null,
        d.summary_zh ?? null,
        d.story_en ?? null,
        d.story_bm ?? null,
        d.story_zh ?? null,
        d.cover_image ?? null,
        d.cover_thumb ?? null,
        d.seo_title_en ?? null,
        d.seo_title_bm ?? null,
        d.seo_title_zh ?? null,
        d.seo_desc_en ?? null,
        d.seo_desc_bm ?? null,
        d.seo_desc_zh ?? null,
        Number(d.sort_order ?? 0),
        d.is_published === 0 ? 0 : 1,
        id
      );
  },
  async deleteAward(id: number): Promise<void> {
    await db.prepare('DELETE FROM award_media WHERE award_id = ?').run(id);
    await db.prepare('DELETE FROM awards WHERE id = ?').run(id);
  },
  async setAwardPublished(id: number, published: boolean): Promise<void> {
    await db
      .prepare(`UPDATE awards SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(published ? 1 : 0, id);
  },
  async reorderAwards(orderedIds: number[]): Promise<void> {
    const stmt = db.prepare('UPDATE awards SET sort_order = ? WHERE id = ?');
    for (let i = 0; i < orderedIds.length; i++) await stmt.run(i + 1, orderedIds[i]);
  },
  async addAwardMedia(
    awardId: number,
    items: { file_path: string; thumb_path?: string | null; type?: string; is_cover?: boolean }[]
  ): Promise<number> {
    if (items.length === 0) return 0;
    const existing = (await db
      .prepare('SELECT COUNT(*) AS c FROM award_media WHERE award_id = ?')
      .get(awardId)) as { c: number };
    let hasCover = (existing?.c ?? 0) > 0;
    const stmt = db.prepare(
      `INSERT INTO award_media (award_id, type, file_path, thumb_path, is_cover, sort_order)
       VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM award_media WHERE award_id = ?))`
    );
    let added = 0;
    for (const it of items) {
      // First uploaded photo becomes the cover when the award had none.
      const isCover = it.is_cover || !hasCover;
      await stmt.run(awardId, it.type ?? 'image', it.file_path, it.thumb_path ?? null, isCover ? 1 : 0, awardId);
      if (isCover) hasCover = true;
      added++;
    }
    // Mirror the cover onto the award row so cards can render without a join.
    await syncAwardCover(awardId);
    return added;
  },
  async updateAwardMedia(
    id: number,
    d: { caption_en?: string | null; caption_bm?: string | null; caption_zh?: string | null; alt_en?: string | null; alt_bm?: string | null; alt_zh?: string | null }
  ): Promise<void> {
    await db
      .prepare(
        `UPDATE award_media SET caption_en = ?, caption_bm = ?, caption_zh = ?,
           alt_en = ?, alt_bm = ?, alt_zh = ? WHERE id = ?`
      )
      .run(
        d.caption_en ?? null,
        d.caption_bm ?? null,
        d.caption_zh ?? null,
        d.alt_en ?? null,
        d.alt_bm ?? null,
        d.alt_zh ?? null,
        id
      );
  },
  async deleteAwardMedia(id: number): Promise<void> {
    const row = (await db.prepare('SELECT award_id FROM award_media WHERE id = ?').get(id)) as
      | { award_id: number }
      | undefined;
    await db.prepare('DELETE FROM award_media WHERE id = ?').run(id);
    if (row?.award_id) await syncAwardCover(row.award_id);
  },
  async reorderAwardMedia(awardId: number, orderedIds: number[]): Promise<void> {
    const stmt = db.prepare('UPDATE award_media SET sort_order = ? WHERE id = ? AND award_id = ?');
    for (let i = 0; i < orderedIds.length; i++) await stmt.run(i + 1, orderedIds[i], awardId);
  },
  async setAwardMediaCover(awardId: number, mediaId: number): Promise<void> {
    await db.prepare('UPDATE award_media SET is_cover = 0 WHERE award_id = ?').run(awardId);
    await db.prepare('UPDATE award_media SET is_cover = 1 WHERE id = ? AND award_id = ?').run(mediaId, awardId);
    await syncAwardCover(awardId);
  },

  /* ==========================================================
   * GALLERY — activity / award photo wall
   * ========================================================== */

  async listPublishedGallery(): Promise<GalleryItem[]> {
    return (await db
      .prepare('SELECT * FROM gallery WHERE is_published = 1 ORDER BY is_cover DESC, sort_order ASC, id ASC')
      .all()) as GalleryItem[];
  },
  async listAllGallery(): Promise<GalleryItem[]> {
    return (await db
      .prepare('SELECT * FROM gallery ORDER BY is_cover DESC, sort_order ASC, id ASC')
      .all()) as GalleryItem[];
  },
  async getGalleryItem(id: number): Promise<GalleryItem | null> {
    return ((await db.prepare('SELECT * FROM gallery WHERE id = ?').get(id)) as GalleryItem | undefined) ?? null;
  },
  async createGalleryItems(items: Partial<GalleryItem>[]): Promise<number> {
    if (items.length === 0) return 0;
    const existing = (await db.prepare('SELECT COUNT(*) AS c FROM gallery').get()) as { c: number };
    let hasCover = (existing?.c ?? 0) > 0;
    const stmt = db.prepare(
      `INSERT INTO gallery
         (title_en, title_bm, title_zh, caption_en, caption_bm, caption_zh,
          alt_en, alt_bm, alt_zh, year, event_name, file_path, thumb_path,
          is_cover, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
               (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM gallery), ?)`
    );
    let added = 0;
    for (const it of items) {
      const isCover = it.is_cover || !hasCover;
      await stmt.run(
        it.title_en ?? null,
        it.title_bm ?? null,
        it.title_zh ?? null,
        it.caption_en ?? null,
        it.caption_bm ?? null,
        it.caption_zh ?? null,
        it.alt_en ?? null,
        it.alt_bm ?? null,
        it.alt_zh ?? null,
        it.year ?? null,
        it.event_name ?? null,
        it.file_path ?? '',
        it.thumb_path ?? null,
        isCover ? 1 : 0,
        it.is_published === 0 ? 0 : 1
      );
      if (isCover) hasCover = true;
      added++;
    }
    return added;
  },
  async updateGalleryItem(id: number, d: Partial<GalleryItem>): Promise<void> {
    await db
      .prepare(
        `UPDATE gallery SET
           title_en = ?, title_bm = ?, title_zh = ?,
           caption_en = ?, caption_bm = ?, caption_zh = ?,
           alt_en = ?, alt_bm = ?, alt_zh = ?,
           year = ?, event_name = ?, file_path = ?, thumb_path = ?,
           is_published = ?
         WHERE id = ?`
      )
      .run(
        d.title_en ?? null,
        d.title_bm ?? null,
        d.title_zh ?? null,
        d.caption_en ?? null,
        d.caption_bm ?? null,
        d.caption_zh ?? null,
        d.alt_en ?? null,
        d.alt_bm ?? null,
        d.alt_zh ?? null,
        d.year ?? null,
        d.event_name ?? null,
        d.file_path ?? '',
        d.thumb_path ?? null,
        d.is_published === 0 ? 0 : 1,
        id
      );
  },
  async deleteGalleryItem(id: number): Promise<void> {
    await db.prepare('DELETE FROM gallery WHERE id = ?').run(id);
  },
  async reorderGallery(orderedIds: number[]): Promise<void> {
    const stmt = db.prepare('UPDATE gallery SET sort_order = ? WHERE id = ?');
    for (let i = 0; i < orderedIds.length; i++) await stmt.run(i + 1, orderedIds[i]);
  },
  async setGalleryCover(id: number): Promise<void> {
    await db.prepare('UPDATE gallery SET is_cover = 0').run();
    await db.prepare('UPDATE gallery SET is_cover = 1 WHERE id = ?').run(id);
  },

  /* ==========================================================
   * COMMENTS — visitor messages / blessings / testimonials
   * ========================================================== */

  /** Approved comments, newest first (or oldest first), paginated. */
  async listApprovedComments(opts: { page?: number; perPage?: number; order?: 'newest' | 'oldest' } = {}): Promise<PublicComment[]> {
    const perPage = Math.min(Math.max(opts.perPage ?? 10, 1), 50);
    const page = Math.max(opts.page ?? 1, 1);
    const dir = opts.order === 'oldest' ? 'ASC' : 'DESC';
    return (await db
      .prepare(
        `SELECT c.id, c.name, c.message, c.rating, c.language, c.award_id, c.created_at,
                a.title_en AS award_title_en, a.title_bm AS award_title_bm, a.title_zh AS award_title_zh
         FROM comments c
         LEFT JOIN awards a ON a.id = c.award_id
         WHERE c.status = 'approved'
         ORDER BY c.created_at ${dir}, c.id ${dir}
         LIMIT ? OFFSET ?`
      )
      .all(perPage, (page - 1) * perPage)) as PublicComment[];
  },
  async countApprovedComments(): Promise<number> {
    const r = (await db
      .prepare(`SELECT COUNT(*) AS c FROM comments WHERE status = 'approved'`)
      .get()) as { c: number };
    return Number(r?.c ?? 0);
  },
  async createComment(d: {
    name: string;
    email?: string | null;
    phone?: string | null;
    message: string;
    rating?: number | null;
    language?: string | null;
    page?: string | null;
    award_id?: number | null;
    ip?: string | null;
    user_agent?: string | null;
    status?: string;
  }): Promise<number> {
    const info = await db
      .prepare(
        `INSERT INTO comments (parent_id, name, email, phone, message, rating, language, page, award_id, status, ip, user_agent)
         VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        d.name,
        d.email ?? null,
        d.phone ?? null,
        d.message,
        d.rating ?? null,
        d.language ?? 'en',
        d.page ?? null,
        d.award_id ?? null,
        d.status ?? 'pending',
        d.ip ?? null,
        d.user_agent ?? null
      );
    return info.lastInsertRowid as number;
  },
  /** Admin list with optional status filter + free-text search. */
  async listComments(opts: { status?: string; q?: string; limit?: number } = {}): Promise<Comment[]> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (opts.status && opts.status !== 'all') {
      where.push('status = ?');
      params.push(opts.status);
    }
    if (opts.q) {
      where.push('(name LIKE ? OR message LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const q = `%${opts.q}%`;
      params.push(q, q, q, q);
    }
    const limit = Math.min(Math.max(opts.limit ?? 500, 1), 2000);
    const sql = `SELECT * FROM comments ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
                 ORDER BY created_at DESC, id DESC LIMIT ${limit}`;
    return (await db.prepare(sql).all(...params)) as Comment[];
  },
  async countCommentsByStatus(): Promise<Record<string, number>> {
    const rows = (await db
      .prepare('SELECT status, COUNT(*) AS c FROM comments GROUP BY status')
      .all()) as { status: string; c: number }[];
    const out: Record<string, number> = { pending: 0, approved: 0, rejected: 0, spam: 0 };
    for (const r of rows) out[r.status ?? 'pending'] = Number(r.c);
    return out;
  },
  async setCommentsStatus(ids: number[], status: string): Promise<void> {
    if (ids.length === 0) return;
    const stmt = db.prepare('UPDATE comments SET status = ? WHERE id = ?');
    for (const id of ids) await stmt.run(status, id);
  },
  async deleteComments(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const stmt = db.prepare('DELETE FROM comments WHERE id = ?');
    for (const id of ids) await stmt.run(id);
  },

  // Enquiries
  async listAllEnquiries(): Promise<Enquiry[]> {
    return (await db.prepare(SQL.enquiriesAll).all()) as Enquiry[];
  },
  async listEnquiriesByStatus(status: string): Promise<Enquiry[]> {
    return (await db.prepare(SQL.enquiriesByStatus).all(status)) as Enquiry[];
  },
  async getEnquiry(id: number): Promise<Enquiry | null> {
    return (await db.prepare(SQL.enquiryById).get(id) as Enquiry | undefined) ?? null;
  },
  async countEnquiries(): Promise<number> {
    const r = (await db.prepare(`SELECT COUNT(*) as c FROM enquiries`).get()) as { c: number };
    return r.c;
  },
  async countEnquiriesByStatus(status: string): Promise<number> {
    const r = (await db.prepare(`SELECT COUNT(*) as c FROM enquiries WHERE status = ?`).get(status)) as { c: number };
    return r.c;
  },
  async createEnquiry(d: Omit<Enquiry, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<number> {
    const info = await db
      .prepare(
        `INSERT INTO enquiries
         (type, name, phone, whatsapp, email, brand, model, quantity, message, photo_url, video_url, product_id, status, source_page)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?)`
      )
      .run(
        d.type ?? 'general',
        d.name ?? null,
        d.phone ?? null,
        d.whatsapp ?? null,
        d.email ?? null,
        d.brand ?? null,
        d.model ?? null,
        d.quantity ?? null,
        d.message ?? null,
        d.photo_url ?? null,
        d.video_url ?? null,
        d.product_id ?? null,
        d.source_page ?? null
      );
    return info.lastInsertRowid as number;
  },
  async updateEnquiryStatus(id: number, status: string): Promise<void> {
    await db.prepare(`UPDATE enquiries SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);
  },
  async deleteEnquiry(id: number): Promise<void> {
    await db.prepare(`DELETE FROM enquiries WHERE id = ?`).run(id);
  },

  // Locations
  async listActiveLocations(): Promise<Location[]> {
    return (await db.prepare(SQL.activeLocations).all()) as Location[];
  },
  async getHqLocation(): Promise<Location | null> {
    return (await db.prepare(SQL.hqLocation).get() as Location | undefined) ?? null;
  },
  async getLocationBySlug(slug: string): Promise<Location | null> {
    return (await db.prepare(SQL.locationBySlug).get(slug) as Location | undefined) ?? null;
  },

  // FAQs
  async listActiveFaqs(): Promise<FAQ[]> {
    return (await db.prepare(SQL.activeFaqs).all()) as FAQ[];
  },

  // Partners
  async listActivePartners(): Promise<TechnicalPartner[]> {
    return (await db.prepare(SQL.activePartners).all()) as TechnicalPartner[];
  },
  async listFeaturedPartners(limit = 6): Promise<TechnicalPartner[]> {
    return (await db.prepare(SQL.featuredPartners).all(limit)) as TechnicalPartner[];
  },
  async getPartnerBySlug(slug: string): Promise<TechnicalPartner | null> {
    return (await db.prepare(SQL.partnerBySlug).get(slug) as TechnicalPartner | undefined) ?? null;
  },
  async searchPartners(opts: { q?: string; city?: string; serviceType?: string }): Promise<TechnicalPartner[]> {
    const where: string[] = ['status = 1'];
    const params: string[] = [];
    if (opts.q) {
      where.push('(company_name_en LIKE ? OR city LIKE ? OR service_types LIKE ?)');
      const q = `%${opts.q}%`;
      params.push(q, q, q);
    }
    if (opts.city) {
      where.push('city LIKE ?');
      params.push(`%${opts.city}%`);
    }
    if (opts.serviceType) {
      where.push('service_types LIKE ?');
      params.push(`%${opts.serviceType}%`);
    }
    const sql = `SELECT * FROM technical_partners WHERE ${where.join(' AND ')} ORDER BY featured DESC, company_name_en`;
    return (await db.prepare(sql).all(...params)) as TechnicalPartner[];
  },

  // Homepage content
  async listHomepageSections(): Promise<HomepageContent[]> {
    return (await db.prepare(SQL.activeHomepageSections).all()) as HomepageContent[];
  },

  // Settings — wrapper (single-row): handled in settings.ts

  // Counts for dashboard
  async counts(): Promise<{
    products: number;
    brands: number;
    categories: number;
    enquiries: number;
    partners: number;
    locations: number;
    featuredProducts: number;
    featuredPartners: number;
    awards: number;
    gallery: number;
    comments: number;
    commentsPending: number;
  }> {
    const get = async (sql: string) => ((await db.prepare(sql).get()) as { c: number }).c;
    return {
      products: await get(`SELECT COUNT(*) as c FROM products WHERE status = 1`),
      brands: await get(`SELECT COUNT(*) as c FROM brands WHERE status = 1`),
      categories: await get(`SELECT COUNT(*) as c FROM categories WHERE status = 1`),
      enquiries: await get(`SELECT COUNT(*) as c FROM enquiries`),
      partners: await get(`SELECT COUNT(*) as c FROM technical_partners WHERE status = 1`),
      locations: await get(`SELECT COUNT(*) as c FROM locations WHERE status = 1`),
      featuredProducts: await get(`SELECT COUNT(*) as c FROM products WHERE status = 1 AND featured = 1`),
      featuredPartners: await get(`SELECT COUNT(*) as c FROM technical_partners WHERE status = 1 AND featured = 1`),
      awards: await get(`SELECT COUNT(*) as c FROM awards`),
      gallery: await get(`SELECT COUNT(*) as c FROM gallery`),
      comments: await get(`SELECT COUNT(*) as c FROM comments`),
      commentsPending: await get(`SELECT COUNT(*) as c FROM comments WHERE status = 'pending'`),
    };
  },
};

export type {
  Brand,
  Category,
  Product,
  ProductMedia,
  Enquiry,
  FAQ,
  Location,
  TechnicalPartner,
  HomepageContent,
  SiteSetting,
  AboutContent,
  AboutPhoto,
  Award,
  AwardMedia,
  GalleryItem,
  Comment,
  PublicComment,
};
