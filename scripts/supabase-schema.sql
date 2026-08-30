-- ATORA — Supabase / PostgreSQL schema (idempotent)
-- Apply with: npm run db:init   (or paste into the Supabase SQL editor)
-- Types: SERIAL PK, TIMESTAMPTZ for timestamps, INTEGER for boolean flags
--        (the app reads status/featured/is_hq as 0/1), REAL for prices.

CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_bm TEXT,
  name_zh TEXT,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_media (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('image','video')) NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  admin_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  category TEXT,
  question_en TEXT NOT NULL,
  question_bm TEXT,
  question_zh TEXT,
  answer_en TEXT NOT NULL,
  answer_bm TEXT,
  answer_zh TEXT,
  display_order INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS technical_partners (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_type TEXT NOT NULL,
  old_price REAL,
  new_price REAL,
  changed_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS homepage_content (
  id BIGSERIAL PRIMARY KEY,
  section_key TEXT UNIQUE NOT NULL,
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
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_media_product ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);

CREATE TABLE IF NOT EXISTS about_content (
  id SERIAL PRIMARY KEY,
  section_key TEXT UNIQUE NOT NULL,
  title_en TEXT,
  title_bm TEXT,
  title_zh TEXT,
  body_en TEXT,
  body_bm TEXT,
  body_zh TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS about_gallery (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  file_name TEXT,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
