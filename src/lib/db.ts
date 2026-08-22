/**
 * SQLite database connection and schema initialisation.
 * Uses better-sqlite3 for synchronous access (server-only).
 */
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'atora.db');
const DB_PATH = process.env.DATABASE_PATH || DEFAULT_DB_PATH;

// Ensure data directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Singleton — Next.js dev mode will hot-reload, so guard with globalThis.
const globalForDb = globalThis as unknown as { __atoraDb?: Database.Database };
const db: Database.Database = globalForDb.__atoraDb ?? new Database(DB_PATH);
if (process.env.NODE_ENV !== 'production') globalForDb.__atoraDb = db;

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Idempotent schema setup. Safe to call on every cold start.
 */
export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_bm TEXT,
      name_zh TEXT,
      logo TEXT,
      description_en TEXT,
      description_bm TEXT,
      description_zh TEXT,
      display_order INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_bm TEXT,
      name_zh TEXT,
      parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      icon TEXT,
      display_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      sku TEXT,
      name_en TEXT NOT NULL,
      name_bm TEXT,
      name_zh TEXT,
      brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      model TEXT,
      capacity TEXT,
      product_type TEXT,
      description_en TEXT,
      description_bm TEXT,
      description_zh TEXT,
      specifications TEXT,
      stock_status TEXT DEFAULT 'in_stock',
      retail_price REAL,
      wholesale_price REAL,
      promotion_price REAL,
      price_min REAL,
      price_max REAL,
      currency TEXT DEFAULT 'RM',
      price_display_mode TEXT DEFAULT 'SHOW_PRICE',
      featured INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      seo_title_en TEXT,
      seo_description_en TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS product_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT CHECK(type IN ('image','video')) NOT NULL,
      url TEXT NOT NULL,
      alt_text TEXT,
      display_order INTEGER DEFAULT 0,
      is_primary INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT DEFAULT 'general',
      name TEXT,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      brand TEXT,
      model TEXT,
      quantity TEXT,
      message TEXT,
      photo_url TEXT,
      video_url TEXT,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'NEW',
      source_page TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now')),
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      admin_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_bm TEXT,
      name_zh TEXT,
      type TEXT DEFAULT 'branch',
      is_hq INTEGER DEFAULT 0,
      address TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      country TEXT DEFAULT 'Malaysia',
      telephone TEXT,
      whatsapp TEXT,
      email TEXT,
      opening_hours TEXT,
      google_maps_url TEXT,
      google_maps_place_id TEXT,
      latitude REAL,
      longitude REAL,
      photo_url TEXT,
      description_en TEXT,
      description_bm TEXT,
      description_zh TEXT,
      display_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      question_en TEXT NOT NULL,
      question_bm TEXT,
      question_zh TEXT,
      answer_en TEXT NOT NULL,
      answer_bm TEXT,
      answer_zh TEXT,
      display_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS technical_partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      company_name_en TEXT NOT NULL,
      company_name_bm TEXT,
      company_name_zh TEXT,
      contact_person TEXT,
      telephone TEXT,
      whatsapp TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT DEFAULT 'Malaysia',
      service_area TEXT,
      service_types TEXT,
      logo_url TEXT,
      photo_url TEXT,
      description_en TEXT,
      description_bm TEXT,
      description_zh TEXT,
      website TEXT,
      facebook TEXT,
      google_maps_url TEXT,
      display_order INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      show_phone INTEGER DEFAULT 1,
      show_whatsapp INTEGER DEFAULT 1,
      show_email INTEGER DEFAULT 1,
      show_address INTEGER DEFAULT 1,
      show_website INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      price_type TEXT NOT NULL,
      old_price REAL,
      new_price REAL,
      changed_by INTEGER,
      changed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES admin_users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS homepage_content (
      section_key TEXT PRIMARY KEY,
      enabled INTEGER DEFAULT 1,
      title_en TEXT,
      title_bm TEXT,
      title_zh TEXT,
      subtitle_en TEXT,
      subtitle_bm TEXT,
      subtitle_zh TEXT,
      body_en TEXT,
      body_bm TEXT,
      body_zh TEXT,
      image_url TEXT,
      video_url TEXT,
      cta_label_en TEXT,
      cta_label_bm TEXT,
      cta_label_zh TEXT,
      cta_url TEXT,
      display_order INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
    CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
    CREATE INDEX IF NOT EXISTS idx_partners_featured ON technical_partners(featured);
    CREATE INDEX IF NOT EXISTS idx_product_media_product ON product_media(product_id);
  `);
}

// Auto-init on import
try {
  initSchema();
} catch (err) {
  console.error('[db] Schema init error:', err);
}

export default db;

/* ============================================================
 * Helper — typed queries
 * ============================================================ */
export type Brand = {
  id: number;
  slug: string;
  name_en: string;
  name_bm: string | null;
  name_zh: string | null;
  logo: string | null;
  description_en: string | null;
  description_bm: string | null;
  description_zh: string | null;
  display_order: number;
  featured: number;
  status: number;
};

export type Category = {
  id: number;
  slug: string;
  name_en: string;
  name_bm: string | null;
  name_zh: string | null;
  parent_id: number | null;
  icon: string | null;
  display_order: number;
  status: number;
};

export type Product = {
  id: number;
  slug: string;
  sku: string | null;
  name_en: string;
  name_bm: string | null;
  name_zh: string | null;
  brand_id: number | null;
  category_id: number | null;
  model: string | null;
  capacity: string | null;
  product_type: string | null;
  description_en: string | null;
  description_bm: string | null;
  description_zh: string | null;
  specifications: string | null;
  stock_status: string;
  retail_price: number | null;
  wholesale_price: number | null;
  promotion_price: number | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  price_display_mode: string;
  featured: number;
  status: number;
  seo_title_en: string | null;
  seo_description_en: string | null;
};

export type ProductMedia = {
  id: number;
  product_id: number;
  type: 'image' | 'video';
  url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: number;
  is_featured: number;
};

export type Enquiry = {
  id: number;
  type: string;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  brand: string | null;
  model: string | null;
  quantity: string | null;
  message: string | null;
  photo_url: string | null;
  video_url: string | null;
  product_id: number | null;
  status: string;
  source_page: string | null;
  created_at: string;
};

export type Location = {
  id: number;
  slug: string;
  name_en: string;
  name_bm: string | null;
  name_zh: string | null;
  type: string;
  is_hq: number;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  telephone: string | null;
  whatsapp: string | null;
  email: string | null;
  opening_hours: string | null;
  google_maps_url: string | null;
  google_maps_place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  description_en: string | null;
  description_bm: string | null;
  description_zh: string | null;
  display_order: number;
  status: number;
};

export type FAQ = {
  id: number;
  category: string | null;
  question_en: string;
  question_bm: string | null;
  question_zh: string | null;
  answer_en: string;
  answer_bm: string | null;
  answer_zh: string | null;
  display_order: number;
  status: number;
};

export type TechnicalPartner = {
  id: number;
  slug: string;
  company_name_en: string;
  company_name_bm: string | null;
  company_name_zh: string | null;
  contact_person: string | null;
  telephone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  service_area: string | null;
  service_types: string | null;
  logo_url: string | null;
  photo_url: string | null;
  description_en: string | null;
  description_bm: string | null;
  description_zh: string | null;
  website: string | null;
  facebook: string | null;
  google_maps_url: string | null;
  display_order: number;
  featured: number;
  status: number;
  show_phone: number;
  show_whatsapp: number;
  show_email: number;
  show_address: number;
  show_website: number;
};

export type PriceHistoryEntry = {
  id: number;
  product_id: number;
  price_type: string;
  old_price: number | null;
  new_price: number | null;
  changed_by: number | null;
  changed_at: string;
};

export type SiteSetting = {
  key: string;
  value: string | null;
};

export type HomepageContent = {
  section_key: string;
  enabled: number;
  title_en: string | null;
  title_bm: string | null;
  title_zh: string | null;
  subtitle_en: string | null;
  subtitle_bm: string | null;
  subtitle_zh: string | null;
  body_en: string | null;
  body_bm: string | null;
  body_zh: string | null;
  image_url: string | null;
  video_url: string | null;
  cta_label_en: string | null;
  cta_label_bm: string | null;
  cta_label_zh: string | null;
  cta_url: string | null;
  display_order: number;
};
