/**
 * verify-v3.mjs — V3 §37 data-integrity + spare-parts verification.
 *
 * 1. Mitsubishi Electric elimination check (must be 0 everywhere).
 * 2. Pull the ACTUAL aircond-parts products + their DB categories from the
 *    live DB (truth source for Spare Parts GEO).
 * 3. Confirm no fake locations (only DB-resident locations are real).
 *
 * Reads DATABASE_URL from .env.local.
 */
import { Pool } from 'pg';
import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

loadEnv();
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.POSTGRES_URL;
if (!connectionString) { console.error('Missing DATABASE_URL'); process.exit(1); }
const isRemote = /supabase|amazonaws|pooler|railway|render|neon/i.test(connectionString);
const pool = new Pool({ connectionString, ssl: isRemote ? { rejectUnauthorized: false } : undefined, max: 3 });

const q = async (sql, params = []) => (await pool.query(sql, params)).rows;

const report = { generatedAt: new Date().toISOString(), mitsubishi: {}, realData: {}, fakeLocationCheck: {} };

try {
  // ---- 1. Mitsubishi elimination ----
  const mBrand = await q(`SELECT count(*)::int AS c FROM brands WHERE slug ILIKE '%mitsubishi%' OR name_en ILIKE '%mitsubishi%'`);
  const mProd = await q(`SELECT count(*)::int AS c FROM products WHERE brand_id IN (SELECT id FROM brands WHERE slug ILIKE '%mitsubishi%' OR name_en ILIKE '%mitsubishi%') OR name_en ILIKE '%mitsubishi%' OR sku ILIKE '%mitsubishi%'`);
  const mMedia = await q(`SELECT count(*)::int AS c FROM product_media pm JOIN products p ON pm.product_id=p.id WHERE p.name_en ILIKE '%mitsubishi%'`);
  const mFaq = await q(`SELECT count(*)::int AS c FROM faqs WHERE answer_en ILIKE '%mitsubishi%' OR answer_bm ILIKE '%mitsubishi%' OR answer_zh ILIKE '%mitsubishi%' OR question_en ILIKE '%mitsubishi%'`);
  const mSetting = await q(`SELECT count(*)::int AS c FROM site_settings WHERE value ILIKE '%mitsubishi%'`);
  report.mitsubishi = {
    brands: mBrand[0].c, products: mProd[0].c, productMedia: mMedia[0].c,
    faqs: mFaq[0].c, siteSettings: mSetting[0].c,
    total: mBrand[0].c + mProd[0].c + mMedia[0].c + mFaq[0].c + mSetting[0].c,
  };

  // ---- 2. Real spare-parts products (truth source) ----
  const partsCats = await q(`SELECT id, slug, name_en, name_bm, name_zh FROM categories WHERE slug LIKE 'aircond-parts-%'`);
  const partsCatIds = partsCats.map((c) => c.id);
  let partsProducts = [];
  if (partsCatIds.length) {
    const ph = partsCatIds.map((_, i) => `$${i + 1}`).join(',');
    partsProducts = await q(
      `SELECT p.id, p.name_en, p.name_bm, p.name_zh, p.sku, p.brand_id, c.slug AS category_slug, c.name_en AS category_en
       FROM products p JOIN categories c ON p.category_id=c.id
       WHERE p.category_id IN (${ph}) AND p.status = 1
       ORDER BY c.slug, p.name_en`,
      partsCatIds
    );
  }
  const allCats = await q(`SELECT slug, name_en, name_bm, name_zh, parent_id FROM categories WHERE status = 1 ORDER BY slug`);
  const allBrands = await q(`SELECT slug, name_en, name_bm, name_zh FROM brands WHERE status = 1 ORDER BY name_en`);
  const locations = await q(`SELECT slug, name_en, name_bm, name_zh, state, city, type FROM locations WHERE status = 1 ORDER BY name_en`);

  report.realData = {
    aircondPartsCategoryCount: partsCats.length,
    aircondPartsCategorySlugs: partsCats.map((c) => c.slug),
    actualSparePartsCount: partsProducts.length,
    sparePartsSample: partsProducts.slice(0, 12).map((p) => ({ name: p.name_en, category: p.category_slug, sku: p.sku })),
    totalActiveCategories: allCats.length,
    totalActiveBrands: allBrands.length,
    activeBrands: allBrands.map((b) => b.name_en),
    totalActiveLocations: locations.length,
    locations: locations.map((l) => ({ slug: l.slug, name: l.name_en, state: l.state, city: l.city, type: l.type })),
    fakeLocationKeywords: ['branch', 'store', 'warehouse', 'outlet', 'shop', 'office', 'address'],
  };

  // ---- 3. Fake-location heuristic (warn only) ----
  const fakeHits = locations.filter((l) =>
    report.realData.fakeLocationKeywords.some((k) => (l.name_en || '').toLowerCase().includes(k))
  );
  report.fakeLocationCheck = {
    suspiciousCount: fakeHits.length,
    suspicious: fakeHits.map((l) => l.slug),
    note: 'ATORA has no physical retail branches/stores per V3 §14/§15; only real HQ/local-service locations are allowed.',
  };

  console.log(JSON.stringify(report, null, 2));
} catch (e) {
  console.error('VERIFY ERROR:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
