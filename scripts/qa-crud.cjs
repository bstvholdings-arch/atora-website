/**
 * QA CRUD battery — exercises the exact DB operations the admin Server Actions
 * perform (create -> read -> update -> delete) for every managed entity, and
 * asserts counts return to baseline. Mirrors src/lib/actions.ts SQL.
 */
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'data', 'atora.db'));
db.pragma('foreign_keys = ON');

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } };

function count(t) { return db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c; }

// ---------- BRAND ----------
{
  const base = count('brands');
  const r = db.prepare("INSERT INTO brands (slug,name_en,name_bm,name_zh,status) VALUES (?,?,?,?,1)").run('qa-brand','QA Brand','Jenama QA','QA 品牌');
  const id = r.lastInsertRowid;
  ok('BRAND create', count('brands') === base + 1);
  ok('BRAND read', db.prepare('SELECT id FROM brands WHERE id=?').get(id) != null);
  db.prepare("UPDATE brands SET name_en='QA Brand UPD' WHERE id=?").run(id);
  ok('BRAND update', db.prepare('SELECT name_en FROM brands WHERE id=?').get(id).name_en === 'QA Brand UPD');
  db.prepare('DELETE FROM brands WHERE id=?').run(id);
  ok('BRAND delete (back to baseline)', count('brands') === base);
}

// ---------- CATEGORY ----------
{
  const base = count('categories');
  const r = db.prepare("INSERT INTO categories (slug,name_en,status) VALUES (?,?,1)").run('qa-cat','QA Category');
  const id = r.lastInsertRowid;
  ok('CATEGORY create', count('categories') === base + 1);
  db.prepare("UPDATE categories SET name_bm='Kategori QA' WHERE id=?").run(id);
  ok('CATEGORY update', db.prepare('SELECT name_bm FROM categories WHERE id=?').get(id).name_bm === 'Kategori QA');
  db.prepare('DELETE FROM categories WHERE id=?').run(id);
  ok('CATEGORY delete (back to baseline)', count('categories') === base);
}

// ---------- PRODUCT (+ MEDIA) ----------
{
  const base = count('products');
  const brandId = db.prepare('SELECT id FROM brands LIMIT 1').get().id;
  const catId = db.prepare('SELECT id FROM categories LIMIT 1').get().id;
  const r = db.prepare("INSERT INTO products (slug,name_en,brand_id,category_id,price_display_mode,status) VALUES (?,?,?,?,?,1)").run('qa-prod','QA Product', brandId, catId, 'CONTACT_FOR_PRICE');
  const pid = r.lastInsertRowid;
  ok('PRODUCT create', count('products') === base + 1);
  db.prepare("UPDATE products SET name_zh='QA 产品' WHERE id=?").run(pid);
  ok('PRODUCT update', db.prepare('SELECT name_zh FROM products WHERE id=?').get(pid).name_zh === 'QA 产品');

  // media for this product
  const mbase = count('product_media');
  const mr = db.prepare("INSERT INTO product_media (product_id,type,url,is_primary) VALUES (?,?,?,1)").run(pid, 'image', 'https://placehold.co/600x600');
  const mid = mr.lastInsertRowid;
  ok('MEDIA create', count('product_media') === mbase + 1);
  db.prepare("UPDATE product_media SET alt_text='QA alt' WHERE id=?").run(mid);
  ok('MEDIA update', db.prepare('SELECT alt_text FROM product_media WHERE id=?').get(mid).alt_text === 'QA alt');
  db.prepare('DELETE FROM product_media WHERE id=?').run(mid);
  ok('MEDIA delete', count('product_media') === mbase);

  db.prepare('DELETE FROM products WHERE id=?').run(pid);
  ok('PRODUCT delete (back to baseline)', count('products') === base);
}

// ---------- LOCATION ----------
{
  const base = count('locations');
  const r = db.prepare("INSERT INTO locations (slug,name_en,google_maps_url,status) VALUES (?,?,?,1)").run('qa-loc','QA Location','https://maps.google.com/?q=qa');
  const id = r.lastInsertRowid;
  ok('LOCATION create', count('locations') === base + 1);
  db.prepare("UPDATE locations SET city='Kuala Lumpur' WHERE id=?").run(id);
  ok('LOCATION update', db.prepare('SELECT city FROM locations WHERE id=?').get(id).city === 'Kuala Lumpur');
  db.prepare('DELETE FROM locations WHERE id=?').run(id);
  ok('LOCATION delete (back to baseline)', count('locations') === base);
}

// ---------- PARTNER ----------
{
  const base = count('technical_partners');
  const r = db.prepare("INSERT INTO technical_partners (slug,company_name_en,status) VALUES (?,?,1)").run('qa-partner','QA Partner Co');
  const id = r.lastInsertRowid;
  ok('PARTNER create', count('technical_partners') === base + 1);
  db.prepare("UPDATE technical_partners SET city='Penang' WHERE id=?").run(id);
  ok('PARTNER update', db.prepare('SELECT city FROM technical_partners WHERE id=?').get(id).city === 'Penang');
  db.prepare('DELETE FROM technical_partners WHERE id=?').run(id);
  ok('PARTNER delete (back to baseline)', count('technical_partners') === base);
}

// ---------- FAQ ----------
{
  const base = count('faqs');
  const r = db.prepare("INSERT INTO faqs (question_en,answer_en,status) VALUES (?,?,1)").run('QA question?','QA answer');
  const id = r.lastInsertRowid;
  ok('FAQ create', count('faqs') === base + 1);
  db.prepare("UPDATE faqs SET answer_bm='Jawapan QA' WHERE id=?").run(id);
  ok('FAQ update', db.prepare('SELECT answer_bm FROM faqs WHERE id=?').get(id).answer_bm === 'Jawapan QA');
  db.prepare('DELETE FROM faqs WHERE id=?').run(id);
  ok('FAQ delete (back to baseline)', count('faqs') === base);
}

console.log(`\nCRUD SUMMARY: ${pass} passed, ${fail} failed`);
db.close();
process.exit(fail === 0 ? 0 : 1);
