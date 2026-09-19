import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

// Load .env.local manually (Next loads it; standalone script must do it itself)
const envPath = path.join(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
}
const connectionString = env.DATABASE_URL || env.DIRECT_URL || env.POSTGRES_URL;
if (!connectionString) { console.error('No DATABASE_URL found'); process.exit(1); }

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const q = async (sql, p = []) => (await pool.query(sql, p)).rows;

const report = {};
report.brands = await q(`SELECT id, slug, name_en, status FROM brands ORDER BY display_order, id`);
report.categories = await q(`SELECT id, slug, name_en, parent_id, status FROM categories ORDER BY (parent_id IS NULL) DESC, parent_id NULLS FIRST, display_order, id`);
report.productCount = (await q(`SELECT count(*)::int AS c FROM products`))[0].c;
report.productsByCategory = await q(`SELECT COALESCE(c.name_en,'<none>') AS category, count(*)::int AS n FROM products p LEFT JOIN categories c ON c.id=p.category_id GROUP BY c.name_en ORDER BY n DESC`);
report.productsByBrand = await q(`SELECT COALESCE(b.name_en,'<none>') AS brand, count(*)::int AS n FROM products p LEFT JOIN brands b ON b.id=p.brand_id GROUP BY b.name_en ORDER BY n DESC`);
report.productTypeBreakdown = await q(`SELECT COALESCE(product_type,'<none>') AS product_type, count(*)::int AS n FROM products GROUP BY product_type ORDER BY n DESC`);
report.locations = await q(`SELECT name_en, type, state, city, is_hq, status FROM locations ORDER BY display_order, id`);
report.faqCount = (await q(`SELECT count(*)::int AS c FROM faqs`))[0].c;
report.faqCategories = await q(`SELECT COALESCE(category,'<none>') AS category, count(*)::int AS n FROM faqs GROUP BY category ORDER BY n DESC`);
report.siteSettings = await q(`SELECT key, value FROM site_settings WHERE key LIKE 'positioning_%' OR key LIKE 'seo_default_%' OR key LIKE 'tagline_%' ORDER BY key`);
report.mitsubishiBrand = await q(`SELECT id, slug, name_en, status FROM brands WHERE lower(name_en) LIKE '%mitsubishi%' OR slug LIKE '%mitsubishi%'`);
report.mitsubishiProducts = await q(`SELECT p.id, p.name_en, b.name_en AS brand FROM products p LEFT JOIN brands b ON b.id=p.brand_id WHERE lower(p.name_en) LIKE '%mitsubishi%' OR lower(b.name_en) LIKE '%mitsubishi%'`);

console.log(JSON.stringify(report, null, 2));
await pool.end();
