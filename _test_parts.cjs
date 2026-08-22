const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('data/atora.db');

// 1. 找一个零件子分类（Compressor id=12 或按名称查）
const cat = db
  .prepare(`SELECT id, name_en, parent_id FROM categories WHERE parent_id = 11 LIMIT 1`)
  .get();
console.log('目标分类: ' + JSON.stringify(cat));

// 2. 插入测试产品（status=1，会出现在前台）
const slug = 'test-temp-item-' + Date.now();
const info = db
  .prepare(
    `INSERT INTO products (name_en, name_bm, name_zh, slug, brand_id, category_id, status, featured, price_display_mode, stock_status, currency, created_at, updated_at)
     VALUES (@name, @name, @name, @slug, NULL, @catId, 1, 0, 'CONTACT_FOR_PRICE', 'in_stock', 'RM', datetime('now'), datetime('now'))`
  )
  .run({ name: 'TEST TEMP ITEM - PLEASE IGNORE', slug, catId: cat.id });
console.log('已插入产品 id=' + info.lastInsertRowid + ' slug=' + slug);

// 3. 前台展示 SQL（与 /parts 页面相同逻辑：非冷气组）
const groups = db
  .prepare(`SELECT id FROM categories WHERE parent_id IS NULL AND status = 1 AND id != 1`)
  .all();
const ids = groups.map((g) => g.id);
const placeholders = ids.map(() => '?').join(',');
const shown = db
  .prepare(
    `SELECT p.id, p.name_en, c.name_en AS cat FROM products p JOIN categories c ON p.category_id = c.id
     WHERE p.status = 1 AND (p.category_id IN (${placeholders}) OR p.category_id IN (SELECT id FROM categories WHERE parent_id IN (${placeholders})))
     AND p.id = ?`
  )
  .all(...ids, ...ids, info.lastInsertRowid);
console.log('/parts 应展示该产品: ' + (shown.length ? '是 ✓ (' + shown[0].name_en + ')' : '否 ✗'));

// 4. 清理：删除测试产品
db.prepare('DELETE FROM products WHERE id = ?').run(info.lastInsertRowid);
console.log('已删除测试产品');
db.close();
