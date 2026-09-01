/**
 * Site settings helpers — single-row key/value config.
 */
import db from './db';

export const DEFAULT_SETTINGS: Record<string, string> = {
  // Company
  company_name_en: 'ATORA AIR COND & ELECTRICAL SDN. BHD.',
  company_name_bm: 'ATORA AIR COND & ELECTRICAL SDN. BHD.',
  company_name_zh: '东京冷气电器有限公司',
  registration_no: '202201011180 (1456877-A)',
  tagline_en: 'Northern Malaysia Aircond Specialist — Wholesale, Retail & Spare Parts',
  tagline_bm: 'Pakar Aircond Utara Malaysia — Borong, Runcit & Alat Ganti',
  tagline_zh: '北马专业冷气专门店 — 批发、零售与零件',
  // Contact
  hq_phone: '010-383 8222',
  whatsapp_number: '60103838222',
  email: 'atoraaircond12@gmail.com',
  website: 'https://atora.com.my',
  facebook: '',
  instagram: '',
  // HQ address (display only — full address lives in locations table)
  hq_address: 'Taman Puteri, Lorong Puteri 1, 09400 Padang Serai, Kedah, Malaysia',
  // SEO defaults (V2: Northern Malaysia / Kedah primary, nationwide broader)
  seo_default_title_en: 'ATORA — Northern Malaysia Aircond Specialist | Wholesale & Parts Supplier',
  seo_default_title_bm: 'ATORA — Pakar Aircond Utara Malaysia | Pembekal Borong & Alat Ganti',
  seo_default_title_zh: 'ATORA — 北马专业冷气专门店 | 马来西亚冷气批发与零件供应商',
  seo_default_description_en:
    'ATORA AIR COND & ELECTRICAL SDN. BHD. (东京冷气电器有限公司) is a Kedah-based Northern Malaysia aircond specialist and Midea Pro Shop. We supply air conditioners, wholesale solutions and spare parts — Midea, Daikin, Panasonic, AUX, Acson, Haier, Hisense, TCL and more — serving Padang Serai, Kulim, Sungai Petani, Alor Setar and customers across Malaysia.',
  seo_default_description_bm:
    'ATORA AIR COND & ELECTRICAL SDN. BHD. ialah pakar aircond Utara Malaysia berasaskan Kedah dan Midea Pro Shop. Kami membekalkan penyaman udara, penyelesaian borong dan alat ganti — Midea, Daikin, Panasonic, AUX, Acson, Haier, Hisense, TCL dan lain-lain — kepada pelanggan di Padang Serai, Kulim, Sungai Petani, Alor Setar serta seluruh Malaysia.',
  seo_default_description_zh:
    'ATORA AIR COND & ELECTRICAL SDN. BHD.（东京冷气电器有限公司）是位于吉打州的北马专业冷气专门店，亦是 Midea Pro Shop。我们供应冷气机、批发方案与零件 —— Midea、Daikin、Panasonic、AUX、Acson、Haier、Hisense、TCL 等品牌 —— 服务 Padang Serai、Kulim、Sungai Petani、Alor Setar 及全马来西亚客户。',
  // Positioning (single source of truth; mirrored in src/lib/positioning.ts)
  positioning_primary_en: 'Northern Malaysia Aircond Specialist',
  positioning_primary_bm: 'Pakar Aircond Utara Malaysia',
  positioning_primary_zh: '北马专业冷气专门店',
  positioning_secondary_en:
    'Air Conditioning Wholesale & Retail · Aircond Spare Parts Supplier · Professional Aircond Supplier · Midea Pro Shop',
  positioning_secondary_bm:
    'Borong & Runcit Penyaman Udara · Pembekal Alat Ganti Aircond · Pembekal Aircond Profesional · Midea Pro Shop',
  positioning_secondary_zh: '冷气批发与零售 · 冷气零件供应商 · 专业冷气供应商 · Midea Pro Shop',
  // Opening hours
  opening_hours_en: 'Saturday — Thursday · 9:00 AM — 6:00 PM',
  opening_hours_bm: 'Sabtu — Khamis · 9:00 pagi — 6:00 petang',
  opening_hours_zh: '周六至周四 · 上午 9:00 — 下午 6:00',
  // Footer
  footer_about_en:
    'ATORA AIR COND & ELECTRICAL SDN. BHD. is a Kedah-based Northern Malaysia aircond specialist and multi-brand supplier, serving Padang Serai, Kulim, Sungai Petani, Alor Setar and customers across Malaysia since 2017.',
  footer_about_bm:
    'ATORA AIR COND & ELECTRICAL SDN. BHD. ialah pakar aircond Utara Malaysia berasaskan Kedah dan pembekal pelbagai jenama, melayani Padang Serai, Kulim, Sungai Petani, Alor Setar serta seluruh Malaysia sejak 2017.',
  footer_about_zh:
    'ATORA AIR COND & ELECTRICAL SDN. BHD.（东京冷气电器有限公司）是位于吉打州的北马专业冷气专门店与多品牌供应商，自 2017 年起服务 Padang Serai、Kulim、Sungai Petani、Alor Setar 及全马来西亚客户。',
};

export async function getSetting(key: string, fallback?: string): Promise<string> {
  const row = (await db
    .prepare('SELECT value FROM site_settings WHERE key = ?')
    .get(key)) as { value: string | null } | undefined;
  if (row?.value != null && row.value !== '') return row.value;
  if (fallback !== undefined) return fallback;
  return DEFAULT_SETTINGS[key] ?? '';
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = (await db
    .prepare('SELECT key, value FROM site_settings')
    .all()) as { key: string; value: string | null }[];
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.value !== null && row.value !== '') map[row.key] = row.value;
  }
  return map;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    )
    .run(key, value);
}

export async function setManySettings(entries: Record<string, string>): Promise<void> {
  const stmt = db.prepare(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  );
  for (const [k, v] of Object.entries(entries)) {
    await stmt.run(k, v);
  }
}
