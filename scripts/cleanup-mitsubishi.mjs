/**
 * V3 §12 — DELETE ALL Mitsubishi Electric from the LIVE database.
 *
 * Targets (and only these):
 *  - brands where slug/name matches 'mitsubishi'
 *  - products whose name or brand matches 'mitsubishi'
 *  - product_media for those products
 *  - FAQ answers that mention 'Mitsubishi Electric' (token removed, not the row)
 *  - site_settings values that mention 'Mitsubishi Electric'
 *
 * Logs before/after counts so the final Mitsubishi reference count can be
 * verified as exactly 0. Idempotent: re-running is a no-op.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

const envPath = path.join(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
}
const connectionString = env.DATABASE_URL || env.DIRECT_URL || env.POSTGRES_URL;
if (!connectionString) {
  console.error('No DATABASE_URL found in .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const q = async (sql, p = []) => (await pool.query(sql, p)).rows;

function stripBrand(s) {
  if (!s) return s;
  return s
    .replace(/Mitsubishi\s*Electric/gi, '')
    .replace(/三菱/g, '')
    .replace(/\s*,\s*,+/g, ',')
    .replace(/,\s*and\s+/g, ' and ')
    .replace(/^\s*,|,\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const report = { before: {}, after: {}, actions: [] };

report.before.brands = (await q(`SELECT id, slug, name_en FROM brands WHERE lower(name_en) LIKE '%mitsubishi%' OR slug LIKE '%mitsubishi%'`)).length;
report.before.products = (await q(`SELECT p.id FROM products p LEFT JOIN brands b ON b.id=p.brand_id WHERE lower(p.name_en) LIKE '%mitsubishi%' OR lower(b.name_en) LIKE '%mitsubishi%'`)).length;
report.before.media = (await q(`SELECT pm.id FROM product_media pm WHERE pm.product_id IN (SELECT p.id FROM products p LEFT JOIN brands b ON b.id=p.brand_id WHERE lower(p.name_en) LIKE '%mitsubishi%' OR lower(b.name_en) LIKE '%mitsubishi%')`)).length;
report.before.faqs = (await q(`SELECT id FROM faqs WHERE answer_en ILIKE '%mitsubishi%' OR answer_bm ILIKE '%mitsubishi%' OR answer_zh ILIKE '%mitsubishi%' OR question_en ILIKE '%mitsubishi%'`)).length;
report.before.siteSettings = (await q(`SELECT key FROM site_settings WHERE value ILIKE '%mitsubishi%'`)).length;

// 1) Resolve Mitsubishi product ids
const mitsProducts = await q(`SELECT p.id FROM products p LEFT JOIN brands b ON b.id=p.brand_id WHERE lower(p.name_en) LIKE '%mitsubishi%' OR lower(b.name_en) LIKE '%mitsubishi%'`);
const mitsIds = mitsProducts.map((r) => r.id);

// 2) Product media
if (mitsIds.length) {
  const r = await pool.query(`DELETE FROM product_media WHERE product_id = ANY($1::int[])`, [mitsIds]);
  report.actions.push(`deleted ${r.rowCount} product_media rows for Mitsubishi products`);
}

// 3) Products
if (mitsIds.length) {
  const r = await pool.query(`DELETE FROM products WHERE id = ANY($1::int[])`, [mitsIds]);
  report.actions.push(`deleted ${r.rowCount} Mitsubishi products`);
}

// 4) Brand
const rBrand = await pool.query(`DELETE FROM brands WHERE lower(name_en) LIKE '%mitsubishi%' OR slug LIKE '%mitsubishi%'`);
report.actions.push(`deleted ${rBrand.rowCount} Mitsubishi brand rows`);

// 5) FAQ answers — strip the brand token, keep the row
const faqs = await q(`SELECT id, answer_en, answer_bm, answer_zh, question_en FROM faqs WHERE answer_en ILIKE '%mitsubishi%' OR answer_bm ILIKE '%mitsubishi%' OR answer_zh ILIKE '%mitsubishi%' OR question_en ILIKE '%mitsubishi%'`);
for (const f of faqs) {
  await pool.query(
    `UPDATE faqs SET answer_en = $1, answer_bm = $2, answer_zh = $3 WHERE id = $4`,
    [stripBrand(f.answer_en), stripBrand(f.answer_bm), stripBrand(f.answer_zh), f.id]
  );
}
report.actions.push(`cleaned ${faqs.length} FAQ rows (brand token stripped, row kept)`);

// 6) site_settings values
const settings = await q(`SELECT key, value FROM site_settings WHERE value ILIKE '%mitsubishi%'`);
for (const s of settings) {
  await pool.query(`UPDATE site_settings SET value = $1 WHERE key = $2`, [stripBrand(s.value), s.key]);
}
report.actions.push(`cleaned ${settings.length} site_settings values`);

report.after.brands = (await q(`SELECT id FROM brands WHERE lower(name_en) LIKE '%mitsubishi%' OR slug LIKE '%mitsubishi%'`)).length;
report.after.products = (await q(`SELECT p.id FROM products p LEFT JOIN brands b ON b.id=p.brand_id WHERE lower(p.name_en) LIKE '%mitsubishi%' OR lower(b.name_en) LIKE '%mitsubishi%'`)).length;
report.after.media = (await q(`SELECT pm.id FROM product_media pm WHERE pm.product_id IN (SELECT p.id FROM products p LEFT JOIN brands b ON b.id=p.brand_id WHERE lower(p.name_en) LIKE '%mitsubishi%' OR lower(b.name_en) LIKE '%mitsubishi%')`)).length;
report.after.faqs = (await q(`SELECT id FROM faqs WHERE answer_en ILIKE '%mitsubishi%' OR answer_bm ILIKE '%mitsubishi%' OR answer_zh ILIKE '%mitsubishi%' OR question_en ILIKE '%mitsubishi%'`)).length;
report.after.siteSettings = (await q(`SELECT key FROM site_settings WHERE value ILIKE '%mitsubishi%'`)).length;

console.log(JSON.stringify(report, null, 2));
fs.writeFileSync('cleanup_mitsubishi_output.json', JSON.stringify(report, null, 2));
await pool.end();
