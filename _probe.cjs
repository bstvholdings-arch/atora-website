const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('data/atora.db', { readonly: true });
let out = '';

const rows = db.prepare(`
  SELECT p.id, p.name_en, c.name_en AS cat, b.name_en AS brand
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN brands b ON p.brand_id = b.id
  ORDER BY p.id
`).all();

out += 'TOTAL PRODUCTS: ' + rows.length + '\n';
for (const r of rows) {
  out += r.id + ' | ' + r.name_en + ' | cat=' + r.cat + ' | brand=' + r.brand + '\n';
}

// 分组统计：顶级分类下直接挂的产品数（parent_id IS NULL 的顶级分组）
const grp = db.prepare(`
  SELECT c.id, c.name_en, COUNT(p.id) AS n
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
  WHERE c.parent_id IS NULL
  GROUP BY c.id
`).all();
out += '\nGROUP COUNTS (top-level):\n';
for (const g of grp) out += g.id + ' ' + g.name_en + ': ' + g.n + '\n';

// 每个子分类下挂的产品数
const sub = db.prepare(`
  SELECT c.parent_id, c.name_en, COUNT(p.id) AS n
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
  WHERE c.parent_id IS NOT NULL
  GROUP BY c.id
`).all();
out += '\nSUB CATEGORY COUNTS:\n';
for (const s of sub) out += 'parent=' + s.parent_id + ' ' + s.name_en + ': ' + s.n + '\n';

db.close();
fs.writeFileSync('_probe.txt', out);
console.log('written');
