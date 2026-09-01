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
};
