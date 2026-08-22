/**
 * PostgreSQL database connection (Supabase) — async compatibility layer.
 * Provides a better-sqlite3-style API (prepare().get / .all / .run) so the
 * repository layer (data.ts) only needs `await` added at call sites.
 *
 * Placeholders: SQLite `?` are rewritten to `$1, $2, ...` automatically.
 * `datetime('now')` is rewritten to `CURRENT_TIMESTAMP`.
 * INSERT statements get `RETURNING id` appended so `.run().lastInsertRowid`
 * keeps working.
 */
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    'Missing DATABASE_URL / DIRECT_URL. Set it in your Vercel project env or .env.local'
  );
}

const isRemote = /supabase|amazonaws|pooler|railway|render|neon/i.test(connectionString);

const createPool = () =>
  new Pool({
    connectionString,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });

// Singleton — Next.js dev mode hot-reloads, so guard with globalThis.
const globalForDb = globalThis as unknown as { __atoraPool?: ReturnType<typeof createPool> };
const pool = globalForDb.__atoraPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalForDb.__atoraPool = pool;

/** Convert SQLite-style `?` placeholders and `datetime('now')` to PostgreSQL. */
function toPg(sql: string): string {
  let i = 0;
  let out = sql.replace(/\?/g, () => `$${++i}`);
  out = out.replace(/datetime\('now',\s*'localtime'\)/gi, 'CURRENT_TIMESTAMP');
  out = out.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');
  out = out.replace(/datetime\('now',\s*'utc'\)/gi, 'CURRENT_TIMESTAMP');
  // Strip any remaining datetime(...) wrapper (e.g. datetime(column) used for casting)
  out = out.replace(/datetime\(([^)]+)\)/gi, '$1');
  return out;
}

type Row = Record<string, any>;

export interface Statement {
  get: (...params: any[]) => Promise<Row | undefined>;
  all: (...params: any[]) => Promise<Row[]>;
  run: (...params: any[]) => Promise<{ lastInsertRowid: number | bigint | undefined; changes: number }>;
}

export function prepare(sql: string): Statement {
  const psql = toPg(sql);
  const isInsert = /^\s*INSERT\s+(?:OR\s+IGNORE\s+)?INTO/i.test(psql) && !/RETURNING/i.test(psql);
  const execSql = isInsert ? `${psql} RETURNING id` : psql;
  return {
    async get(...params: any[]): Promise<Row | undefined> {
      const r = await pool.query(execSql, params);
      return r.rows[0];
    },
    async all(...params: any[]): Promise<Row[]> {
      const r = await pool.query(execSql, params);
      return r.rows;
    },
    async run(...params: any[]): Promise<{ lastInsertRowid: number | bigint | undefined; changes: number }> {
      const r = await pool.query(execSql, params);
      return {
        lastInsertRowid: r.rows[0]?.id ?? undefined,
        changes: r.rowCount ?? 0,
      };
    },
  };
}

export async function exec(sql: string): Promise<void> {
  await pool.query(sql);
}

/** No-op when using a managed Postgres database (tables are provisioned separately). */
export function initSchema(): void {
  /* tables are created directly in Supabase; nothing to do here */
}

const db = { prepare, exec };
export default db;

/* ============================================================
 * Domain types (shared across server components / repositories)
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
