/** QA: database counts + password hashing + admin user. */
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'data', 'atora.db'));

const tables = ['brands','categories','products','product_media','locations','technical_partners','faqs','admin_users','sessions','enquiries'];
for (const t of tables) {
  try {
    const r = db.prepare(`SELECT COUNT(*) c FROM ${t}`).get();
    console.log(`COUNT ${t} = ${r.c}`);
  } catch (e) { console.log(`COUNT ${t} = ERROR ${e.message}`); }
}

// active vs total for key tables
for (const t of ['brands','categories','products','locations','technical_partners']) {
  try {
    const r = db.prepare(`SELECT COUNT(*) c FROM ${t} WHERE is_active = 1`).get();
    console.log(`ACTIVE ${t} = ${r.c}`);
  } catch {}
}

// featured products
try { console.log('FEATURED products =', db.prepare("SELECT COUNT(*) c FROM products WHERE is_featured = 1").get().c); } catch {}
// products with media
try { console.log('PRODUCTS with >=1 media =', db.prepare("SELECT COUNT(*) c FROM (SELECT DISTINCT product_id FROM product_media)").get().c); } catch {}

// password hashing check
try {
  const a = db.prepare('SELECT email, password_hash FROM admin_users LIMIT 1').get();
  console.log('ADMIN email =', a.email);
  console.log('ADMIN hash starts with $2 =', a.password_hash.startsWith('$2'));
  console.log('ADMIN hash is plaintext =', !a.password_hash.startsWith('$2') && a.password_hash.length < 60);
} catch {}

// price display modes variety
try {
  const rows = db.prepare('SELECT price_display_mode, COUNT(*) c FROM products GROUP BY price_display_mode').all();
  for (const r of rows) console.log(`PRICE_MODE ${r.price_display_mode} = ${r.c}`);
} catch {}

db.close();
