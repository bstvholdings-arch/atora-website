/**
 * Site settings helpers — single-row key/value config.
 */
import db from './db';

export const DEFAULT_SETTINGS: Record<string, string> = {
  // Company
  company_name_en: 'ATORA AIR COND & ELECTRICAL SDN. BHD.',
  company_name_bm: 'ATORA AIR COND & ELECTRICAL SDN. BHD.',
  company_name_zh: 'Atora Aircond & Electrical Sdn Bhd',
  registration_no: '202201011180 (1456877-A)',
  tagline_en: 'Professional Air Conditioning Wholesale & Parts Supplier',
  tagline_bm: 'Pembekal Borong & Alat Ganti Penyaman Udara Profesional',
  tagline_zh: '专业冷气批发与零件供应商',
  // Contact
  hq_phone: '010-383 8222',
  whatsapp_number: '60103838222',
  email: 'sales@atora.com.my',
  website: 'https://atora.com.my',
  facebook: '',
  instagram: '',
  // HQ address (display only — full address lives in locations table)
  hq_address: 'Taman Puteri, Lorong Puteri 1, 09400 Padang Serai, Kedah, Malaysia',
  // SEO defaults
  seo_default_title_en: 'ATORA — Aircond Wholesale & Parts Supplier Malaysia',
  seo_default_title_bm: 'ATORA — Pembekal Borong & Alat Ganti Aircond Malaysia',
  seo_default_title_zh: 'ATORA — 马来西亚冷气批发与零件供应商',
  seo_default_description_en:
    'Multi-brand aircond wholesale, parts & accessories for installers, contractors, businesses and projects across Malaysia. Daikin, Midea, Panasonic, AUX, Acson, Haier, Hisense, TCL.',
  seo_default_description_bm:
    'Pembekal alat ganti dan aksesori penyaman udara pelbagai jenama untuk pemasang, kontraktor, perniagaan dan projek di seluruh Malaysia.',
  seo_default_description_zh:
    '多品牌冷气批发、零件与配件供应，服务全马来西亚安装商、承包商、企业及工程项目。',
  // Opening hours
  opening_hours_en: 'Saturday — Thursday · 9:00 AM — 6:00 PM',
  opening_hours_bm: 'Sabtu — Khamis · 9:00 pagi — 6:00 petang',
  opening_hours_zh: '周六至周四 · 上午 9:00 — 下午 6:00',
  // Footer
  footer_about_en:
    'Professional air conditioning wholesale and parts supplier serving customers nationwide across Malaysia since 2022.',
  footer_about_bm:
    'Pembekal borong dan alat ganti penyaman udara profesional yang melayani pelanggan di seluruh Malaysia sejak 2022.',
  footer_about_zh:
    '自2022年起，专业冷气批发与零件供应商，业务覆盖全马来西亚。',
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
