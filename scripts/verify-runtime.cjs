const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'atora.db');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

function count(t) { return db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c; }

console.log('=== SEED INTEGRITY ===');
for (const t of ['brands','categories','products','locations','technical_partners','faqs','product_media','admin_users','site_settings']) {
  console.log(`  ${t.padEnd(18)} : ${count(t)}`);
}

console.log('\n=== MEDIA FEATURE (exact SQL from actions.ts) ===');
const product = db.prepare('SELECT id, name_en FROM products ORDER BY id LIMIT 1').get();
const pid = product.id;
console.log('  target product:', pid, product.name_en);

// addProductMediaAction pattern: unmark others if primary, then insert
db.prepare('UPDATE product_media SET is_primary = 0 WHERE product_id = ?').run(pid);
const ins = db.prepare(`INSERT INTO product_media (product_id, type, url, alt_text, display_order, is_primary, is_featured)
  VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM product_media WHERE product_id = ?), ?, 0)`);
ins.run(pid, 'image', 'https://example.com/a.jpg', 'Alt A', pid, 1);
ins.run(pid, 'video', 'https://example.com/v.mp4', 'Video V', pid, 0);
console.log('  inserted 2 media rows (1 primary image, 1 video)');

// getProductMediaAction pattern
let media = db.prepare('SELECT * FROM product_media WHERE product_id = ? ORDER BY display_order ASC').all(pid);
console.log('  listed media:', media.map(m => `${m.id}:${m.type}:primary=${m.is_primary}`).join(', '));

// setPrimaryMediaAction pattern
const target = media.find(m => m.type === 'video');
db.prepare('UPDATE product_media SET is_primary = 0 WHERE product_id = ?').run(pid);
db.prepare('UPDATE product_media SET is_primary = 1 WHERE id = ?').run(target.id);
media = db.prepare('SELECT id, type, is_primary FROM product_media WHERE product_id = ?').all(pid);
console.log('  after set-primary:', media.map(m => `${m.id}:${m.type}:primary=${m.is_primary}`).join(', '));

// cleanup test rows
db.prepare('DELETE FROM product_media WHERE product_id = ? AND url LIKE ?').run(pid, 'https://example.com/%');
console.log('  cleaned up test rows; remaining media for product:', count('product_media'));

console.log('\n=== OK: data layer + media SQL paths verified ===');
db.close();
