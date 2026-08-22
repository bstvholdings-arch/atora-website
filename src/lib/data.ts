/**
 * Repository layer — typed queries against the SQLite DB.
 * Centralised so all server components share consistent shape.
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

export const data = {
  // Brands
  listActiveBrands(): Brand[] {
    return db.prepare(SQL.activeBrands).all() as Brand[];
  },
  listFeaturedBrands(): Brand[] {
    return db.prepare(SQL.featuredBrands).all() as Brand[];
  },
  getBrandBySlug(slug: string): Brand | null {
    return (db.prepare(SQL.brandBySlug).get(slug) as Brand | undefined) ?? null;
  },
  listBrandProducts(brandId: number): Product[] {
    return db.prepare(SQL.brandProducts).all(brandId) as Product[];
  },

  // Categories
  listActiveCategories(): Category[] {
    return db.prepare(SQL.activeCategories).all() as Category[];
  },
  listCategoryGroups(): Category[] {
    return db
      .prepare(`SELECT * FROM categories WHERE parent_id IS NULL AND status = 1 ORDER BY display_order, name_en`)
      .all() as Category[];
  },
  getCategoryBySlug(slug: string): Category | null {
    return (db.prepare(SQL.categoryBySlug).get(slug) as Category | undefined) ?? null;
  },

  // Products
  listActiveProducts(): Product[] {
    return db.prepare(SQL.activeProducts).all() as Product[];
  },
  listFeaturedProducts(limit = 8): Product[] {
    return db.prepare(SQL.featuredProducts).all(limit) as Product[];
  },
  getProductBySlug(slug: string): Product | null {
    return (db.prepare(SQL.productBySlug).get(slug) as Product | undefined) ?? null;
  },
  listProductMedia(productId: number): ProductMedia[] {
    return db.prepare(SQL.productMedia).all(productId) as ProductMedia[];
  },
  searchProducts(opts: {
    q?: string;
    brandId?: number;
    categoryId?: number;
    groupId?: number;
    groupIds?: number[];
  }): Product[] {
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
    if (opts.groupId) {
      where.push('(category_id = ? OR category_id IN (SELECT id FROM categories WHERE parent_id = ?))');
      params.push(opts.groupId, opts.groupId);
    }
    if (opts.groupIds && opts.groupIds.length > 0) {
      const marks = opts.groupIds.map(() => '?').join(',');
      where.push(
        `(category_id IN (${marks}) OR category_id IN (SELECT id FROM categories WHERE parent_id IN (${marks})))`
      );
      params.push(...opts.groupIds, ...opts.groupIds);
    }
    const sql = `SELECT * FROM products WHERE ${where.join(' AND ')} ORDER BY featured DESC, name_en LIMIT 200`;
    return db.prepare(sql).all(...params) as Product[];
  },

  // Enquiries
  listAllEnquiries(): Enquiry[] {
    return db.prepare(SQL.enquiriesAll).all() as Enquiry[];
  },
  listEnquiriesByStatus(status: string): Enquiry[] {
    return db.prepare(SQL.enquiriesByStatus).all(status) as Enquiry[];
  },
  getEnquiry(id: number): Enquiry | null {
    return (db.prepare(SQL.enquiryById).get(id) as Enquiry | undefined) ?? null;
  },
  countEnquiries(): number {
    const r = db.prepare(`SELECT COUNT(*) as c FROM enquiries`).get() as { c: number };
    return r.c;
  },
  countEnquiriesByStatus(status: string): number {
    const r = db.prepare(`SELECT COUNT(*) as c FROM enquiries WHERE status = ?`).get(status) as { c: number };
    return r.c;
  },
  createEnquiry(data: Omit<Enquiry, 'id' | 'created_at' | 'updated_at' | 'status'>): number {
    const info = db
      .prepare(
        `INSERT INTO enquiries
         (type, name, phone, whatsapp, email, brand, model, quantity, message, photo_url, video_url, product_id, status, source_page)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?)`
      )
      .run(
        data.type ?? 'general',
        data.name ?? null,
        data.phone ?? null,
        data.whatsapp ?? null,
        data.email ?? null,
        data.brand ?? null,
        data.model ?? null,
        data.quantity ?? null,
        data.message ?? null,
        data.photo_url ?? null,
        data.video_url ?? null,
        data.product_id ?? null,
        data.source_page ?? null
      );
    return info.lastInsertRowid as number;
  },
  updateEnquiryStatus(id: number, status: string): void {
    db.prepare(`UPDATE enquiries SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);
  },
  deleteEnquiry(id: number): void {
    db.prepare(`DELETE FROM enquiries WHERE id = ?`).run(id);
  },

  // Locations
  listActiveLocations(): Location[] {
    return db.prepare(SQL.activeLocations).all() as Location[];
  },
  getHqLocation(): Location | null {
    return (db.prepare(SQL.hqLocation).get() as Location | undefined) ?? null;
  },
  getLocationBySlug(slug: string): Location | null {
    return (db.prepare(SQL.locationBySlug).get(slug) as Location | undefined) ?? null;
  },

  // FAQs
  listActiveFaqs(): FAQ[] {
    return db.prepare(SQL.activeFaqs).all() as FAQ[];
  },

  // Partners
  listActivePartners(): TechnicalPartner[] {
    return db.prepare(SQL.activePartners).all() as TechnicalPartner[];
  },
  listFeaturedPartners(limit = 6): TechnicalPartner[] {
    return db.prepare(SQL.featuredPartners).all(limit) as TechnicalPartner[];
  },
  getPartnerBySlug(slug: string): TechnicalPartner | null {
    return (db.prepare(SQL.partnerBySlug).get(slug) as TechnicalPartner | undefined) ?? null;
  },
  searchPartners(opts: { q?: string; city?: string; serviceType?: string }): TechnicalPartner[] {
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
    return db.prepare(sql).all(...params) as TechnicalPartner[];
  },

  // Homepage content
  listHomepageSections(): HomepageContent[] {
    return db.prepare(SQL.activeHomepageSections).all() as HomepageContent[];
  },

  // Settings — wrapper (single-row): handled in settings.ts

  // Counts for dashboard
  counts(): {
    products: number;
    brands: number;
    categories: number;
    enquiries: number;
    partners: number;
    locations: number;
    featuredProducts: number;
    featuredPartners: number;
  } {
    const get = (sql: string) => (db.prepare(sql).get() as { c: number }).c;
    return {
      products: get(`SELECT COUNT(*) as c FROM products WHERE status = 1`),
      brands: get(`SELECT COUNT(*) as c FROM brands WHERE status = 1`),
      categories: get(`SELECT COUNT(*) as c FROM categories WHERE status = 1`),
      enquiries: get(`SELECT COUNT(*) as c FROM enquiries`),
      partners: get(`SELECT COUNT(*) as c FROM technical_partners WHERE status = 1`),
      locations: get(`SELECT COUNT(*) as c FROM locations WHERE status = 1`),
      featuredProducts: get(`SELECT COUNT(*) as c FROM products WHERE status = 1 AND featured = 1`),
      featuredPartners: get(`SELECT COUNT(*) as c FROM technical_partners WHERE status = 1 AND featured = 1`),
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
};
