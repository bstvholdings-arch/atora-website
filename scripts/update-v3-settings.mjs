/**
 * V3 §2/§30 — push the nationwide-primary positioning + copy into the LIVE
 * site_settings table so the public site (which overrides code defaults with
 * DB values) reflects the new entity: "ATORA = Malaysia Aircond Wholesale &
 * Air Conditioning Parts Supplier" with "Nationwide Malaysia Delivery".
 *
 * Mirrors src/lib/settings.ts DEFAULT_SETTINGS (single source of truth).
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

const entries = {
  positioning_primary_en: 'Malaysia Aircond Wholesale & Air Conditioning Parts Supplier',
  positioning_primary_bm: 'Pembekal Borong Aircond & Alat Ganti Penyaman Udara Malaysia',
  positioning_primary_zh: '马来西亚冷气批发与空调零件供应商',
  seo_default_title_en: 'ATORA — Malaysia Aircond Wholesale & Air Conditioning Parts Supplier',
  seo_default_title_bm: 'ATORA — Pembekal Borong Aircond & Alat Ganti Penyaman Udara Malaysia',
  seo_default_title_zh: 'ATORA — 马来西亚冷气批发与空调零件供应商',
  seo_default_description_en:
    'ATORA AIR COND & ELECTRICAL SDN. BHD. (东京冷气电器有限公司) is a Malaysia-based air conditioning wholesaler and air conditioning parts supplier, headquartered in Kedah (Northern Malaysia). We supply air conditioners, wholesale solutions and spare parts — Midea, Daikin, Panasonic, AUX, Acson, Haier, Hisense, TCL, Topaire and more — with Nationwide Malaysia Delivery across Padang Serai, Kulim, Sungai Petani, Alor Setar and all of Malaysia.',
  seo_default_description_bm:
    'ATORA AIR COND & ELECTRICAL SDN. BHD. ialah pembekal borong penyaman udara dan alat ganti penyaman udara berasaskan Malaysia, beribu pejabat di Kedah (Utara Malaysia). Kami membekalkan penyaman udara, penyelesaian borong dan alat ganti — Midea, Daikin, Panasonic, AUX, Acson, Haier, Hisense, TCL, Topaire dan lain-lain — dengan Penghantaran Seluruh Malaysia ke Padang Serai, Kulim, Sungai Petani, Alor Setar serta seluruh Malaysia.',
  seo_default_description_zh:
    'ATORA AIR COND & ELECTRICAL SDN. BHD.（东京冷气电器有限公司）是总部位于马来西亚（北马吉打州）的冷气批发与空调零件供应商。我们供应冷气机、批发方案与零件 —— Midea、Daikin、Panasonic、AUX、Acson、Haier、Hisense、TCL、Topaire 等品牌 —— 通过马来西亚全国配送覆盖 Padang Serai、Kulim、Sungai Petani、Alor Setar 及全马来西亚。',
  tagline_en: 'Malaysia Aircond Wholesale & Parts Supplier — Nationwide Delivery',
  tagline_bm: 'Pembekal Borong & Alat Ganti Aircond Malaysia — Penghantaran Seluruh Malaysia',
  tagline_zh: '马来西亚冷气批发与零件供应商 — 全国配送',
  footer_about_en:
    'ATORA AIR COND & ELECTRICAL SDN. BHD. is a Malaysia-based air conditioning wholesaler and multi-brand spare-parts supplier, headquartered in Kedah (Northern Malaysia) and serving customers nationwide across Malaysia since 2017.',
  footer_about_bm:
    'ATORA AIR COND & ELECTRICAL SDN. BHD. ialah pembekal borong penyaman udara Malaysia dan pembekal alat ganti pelbagai jenama, beribu pejabat di Kedah (Utara Malaysia) serta melayani pelanggan di seluruh Malaysia sejak 2017.',
  footer_about_zh:
    'ATORA AIR COND & ELECTRICAL SDN. BHD.（东京冷气电器有限公司）是总部位于马来西亚（北马吉打州）的冷气批发与多品牌零件供应商，自 2017 年起服务全马来西亚客户。',
};

const upsert =
  `INSERT INTO site_settings (key, value, updated_at)
   VALUES ($1, $2, now())
   ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()`;

for (const [k, v] of Object.entries(entries)) {
  await pool.query(upsert, [k, v]);
}

const keys = Object.keys(entries);
const updated = await pool.query(
  `SELECT key, value FROM site_settings WHERE key = ANY($1::text[]) ORDER BY key`,
  [keys]
);
console.log(`Updated ${updated.rowCount} site_settings rows.`);
for (const r of updated.rows) {
  console.log(`  ${r.key} = ${r.value.slice(0, 80)}${r.value.length > 80 ? '…' : ''}`);
}
await pool.end();
