/**
 * Seed script — populate the ATORA Supabase/PostgreSQL DB with all sample data.
 *
 * Run with: `npm run db:seed`   (requires DATABASE_URL in .env)
 *
 * The schema is applied idempotently from scripts/supabase-schema.sql first,
 * so a single `db:seed` fully provisions a fresh database.
 */
import db, { runSqlFile } from './pg-helper.mjs';
import bcrypt from 'bcryptjs';

console.log('[seed] Applying schema (scripts/supabase-schema.sql)...');
await runSqlFile('scripts/supabase-schema.sql');

console.log('[seed] Clearing existing data...');
await db.exec(`
  DELETE FROM enquiries;
  DELETE FROM product_media;
  DELETE FROM price_history;
  DELETE FROM products;
  DELETE FROM brands;
  DELETE FROM categories;
  DELETE FROM faqs;
  DELETE FROM technical_partners;
  DELETE FROM locations;
  DELETE FROM homepage_content;
  DELETE FROM site_settings;
  DELETE FROM admin_users WHERE role != 'superadmin';
`);

console.log('[seed] Inserting admin...');
const adminHash = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD || 'Atora@2026', 10);
await db
  .prepare(
    `INSERT INTO admin_users (email, name, password_hash, role) VALUES (?, ?, ?, 'superadmin')
     ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, name = excluded.name`
  )
  .run(
    (process.env.ADMIN_DEFAULT_EMAIL || 'admin@atora.com.my').toLowerCase(),
    process.env.ADMIN_DEFAULT_NAME || 'Administrator',
    adminHash
  );

console.log('[seed] Site settings...');
const settings = [
  ['company_name_en', 'ATORA AIR COND & ELECTRICAL SDN. BHD.'],
  ['company_name_bm', 'ATORA AIR COND & ELECTRICAL SDN. BHD.'],
  ['company_name_zh', '东京冷气电器有限公司'],
  ['registration_no', '202201011180 (1456877-A)'],
  ['tagline_en', 'Professional Air Conditioning Wholesale & Parts Supplier'],
  ['tagline_bm', 'Pembekal Borong & Alat Ganti Penyaman Udara Profesional'],
  ['tagline_zh', '专业冷气批发与零件供应商'],
  ['hq_phone', '010-383 8222'],
  ['whatsapp_number', '60103838222'],
  ['email', 'sales@atora.com.my'],
  ['website', 'https://atora.com.my'],
  ['hq_address', 'Taman Puteri, Lorong Puteri 1, 09400 Padang Serai, Kedah, Malaysia'],
  ['opening_hours_en', 'Saturday — Thursday · 9:00 AM — 6:00 PM'],
  ['opening_hours_bm', 'Sabtu — Khamis · 9:00 pagi — 6:00 petang'],
  ['opening_hours_zh', '周六至周四 · 上午 9:00 — 下午 6:00'],
  ['seo_default_title_en', 'ATORA — Aircond Wholesale & Parts Supplier Malaysia'],
  ['seo_default_title_bm', 'ATORA — Pembekal Borong & Alat Ganti Aircond Malaysia'],
  ['seo_default_title_zh', 'ATORA — 马来西亚冷气批发与零件供应商'],
  ['seo_default_description_en', 'Multi-brand aircond wholesale, parts & accessories for installers, contractors, businesses and projects across Malaysia. Daikin, Midea, Panasonic, AUX, Acson, Haier, Hisense, Mitsubishi Electric, Topaire.'],
  ['seo_default_description_bm', 'Pembekal alat ganti dan aksesori penyaman udara pelbagai jenama untuk pemasang, kontraktor, perniagaan dan projek di seluruh Malaysia.'],
  ['seo_default_description_zh', '多品牌冷气批发、零件与配件供应，服务全马来西亚安装商、承包商、企业及工程项目。'],
  ['footer_about_en', 'Professional air conditioning wholesale and parts supplier serving customers nationwide across Malaysia since 2022.'],
  ['footer_about_bm', 'Pembekal borong dan alat ganti penyaman udara profesional yang melayani pelanggan di seluruh Malaysia sejak 2022.'],
  ['footer_about_zh', '自2022年起，专业冷气批发与零件供应商，业务覆盖全马来西亚。'],
];
const stmtSetting = db.prepare(
  `INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
);
for (const [k, v] of settings) await stmtSetting.run(k, v);

console.log('[seed] Brands...');
const brands = [
  { slug: 'midea', name: 'Midea', desc: 'One of the world\'s largest air conditioner manufacturers, offering reliable and affordable units for residential and commercial use.' },
  { slug: 'daikin', name: 'Daikin', desc: 'Global leader in air conditioning technology, known for inverter efficiency and innovation.' },
  { slug: 'panasonic', name: 'Panasonic', desc: 'Japanese brand trusted for quality air conditioning with nanoe™ purification technology.' },
  { slug: 'aux', name: 'AUX', desc: 'Leading Chinese air conditioner brand, popular for value and durability in Malaysian market.' },
  { slug: 'acson', name: 'Acson', desc: 'Malaysian brand with strong service network, ideal for tropical climate.' },
  { slug: 'haier', name: 'Haier', desc: 'World\'s No.1 home appliance brand, smart air conditioners for modern living.' },
  { slug: 'hisense', name: 'Hisense', desc: 'Innovative air conditioning with smart connectivity and energy efficiency.' },
  { slug: 'topaire', name: 'Topaire', desc: 'Quality air conditioning brand with reliable performance for Malaysian homes.' },
  { slug: 'mitsubishi-electric', name: 'Mitsubishi Electric', desc: 'Premium Japanese brand with industry-leading technology and reliability.' },
];
const stmtBrand = db.prepare(
  `INSERT INTO brands (slug, name_en, name_bm, name_zh, description_en, display_order, featured, status)
   VALUES (?, ?, ?, ?, ?, ?, 1, 1)`
);
brands.forEach((b, i) => stmtBrand.run(b.slug, b.name, b.name, b.name, b.desc, i));
const brandMap = {};
for (const r of await db.prepare('SELECT id, slug FROM brands').all()) brandMap[r.slug] = r.id;

console.log('[seed] Categories...');
const categoryGroups = [
  {
    slug: 'air-conditioners',
    name: 'AIR CONDITIONERS',
    children: ['Wall Mounted', 'Inverter', 'Non-Inverter', 'Split Unit', 'Multi-Split', 'Ceiling Cassette', 'Ceiling Suspended', 'Floor Standing', 'Commercial Aircond'],
  },
  {
    slug: 'aircond-parts',
    name: 'AIRCOND PARTS',
    children: ['Compressor', 'PCB Board', 'Fan Motor', 'Capacitor', 'Sensor', 'Thermostat', 'Relay', 'Contactor', 'Electrical Components', 'Replacement Parts'],
  },
  {
    slug: 'installation-materials',
    name: 'INSTALLATION MATERIALS',
    children: ['Copper Pipe', 'Insulation', 'Drain Pipe', 'Cable', 'Bracket', 'Installation Accessories'],
  },
  {
    slug: 'maintenance-products',
    name: 'MAINTENANCE PRODUCTS',
    children: ['Cleaning Equipment', 'Filters', 'Cleaning Accessories', 'Maintenance Parts'],
  },
];
const stmtParentCat = db.prepare(
  `INSERT INTO categories (slug, name_en, display_order, status) VALUES (?, ?, ?, 1)`
);
const stmtChildCat = db.prepare(
  `INSERT INTO categories (slug, name_en, parent_id, display_order, status) VALUES (?, ?, ?, ?, 1)`
);
categoryGroups.forEach((g, i) => {
  const info = stmtParentCat.run(g.slug, g.name, i);
  const pid = info.lastInsertRowid;
  g.children.forEach((child, j) => {
    stmtChildCat.run(`${g.slug}-${child.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, child, pid, j);
  });
});
const catMap = {};
for (const r of await db.prepare('SELECT id, slug FROM categories').all()) catMap[r.slug] = r.id;

console.log('[seed] Locations...');
const locs = [
  {
    slug: 'padang-serai-hq',
    name: 'ATORA HQ — Padang Serai',
    type: 'hq', is_hq: 1,
    address: 'Taman Puteri, Lorong Puteri 1, 09400 Padang Serai, Kedah, Malaysia',
    city: 'Padang Serai', state: 'Kedah', postal: '09400',
    telephone: '010-383 8222', whatsapp: '60103838222', email: 'hq@atora.com.my',
    hours: 'Saturday — Thursday · 9:00 AM — 6:00 PM',
    gmaps_url: '',
    gmaps_place_id: '',
    latitude: 5.6351, longitude: 100.3676,
  },
  {
    slug: 'sungai-petani',
    name: 'ATORA Sungai Petani',
    type: 'branch', is_hq: 0,
    address: '780, Jalan BM 1/1, Bandar Mutiara, 08000 Sungai Petani, Kedah, Malaysia',
    city: 'Sungai Petani', state: 'Kedah', postal: '08000',
    telephone: '018-280 8222', whatsapp: '60182808222',
    hours: 'Saturday — Thursday · 9:00 AM — 6:00 PM',
    gmaps_url: '', gmaps_place_id: '',
    latitude: 5.6478, longitude: 100.4872,
  },
  {
    slug: 'kulim',
    name: 'ATORA Kulim',
    type: 'branch', is_hq: 0,
    address: '278, Jalan Pondok Labu, Taman Keranji, 09000 Kulim, Kedah, Malaysia',
    city: 'Kulim', state: 'Kedah', postal: '09000',
    telephone: '010-520 8222', whatsapp: '60105208222',
    hours: 'Saturday — Thursday · 9:00 AM — 6:00 PM',
    gmaps_url: '', gmaps_place_id: '',
    latitude: 5.3648, longitude: 100.5611,
  },
];
const stmtLoc = db.prepare(
  `INSERT INTO locations (slug, name_en, name_bm, name_zh, type, is_hq, address, city, state, postal_code, country,
     telephone, whatsapp, email, opening_hours, google_maps_url, google_maps_place_id, latitude, longitude,
     display_order, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Malaysia', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
);
for (let i = 0; i < locs.length; i++) {
  const l = locs[i];
  await stmtLoc.run(
    l.slug, l.name, l.name, l.name,
    l.type, l.is_hq,
    l.address, l.city, l.state, l.postal,
    l.telephone, l.whatsapp, l.email ?? null,
    l.hours, l.gmaps_url ?? null, l.gmaps_place_id ?? null,
    l.latitude, l.longitude, i
  );
}

console.log('[seed] Technical Partners (samples)...');
const partners = [
  {
    slug: 'cool-air-services',
    name_en: 'Cool Air Services',
    name_zh: '冷气服务公司',
    contact: 'Mr. Tan',
    tel: '012-345 6789', whatsapp: '60123456789', email: 'coolair@example.com',
    address: '12, Jalan Industri', city: 'Sungai Petani', state: 'Kedah',
    service_area: 'Northern Malaysia',
    service_types: 'Aircond Installation,Aircond Repair,Aircond Maintenance,Commercial Aircond',
    featured: 1, status: 1,
    desc: 'Trusted aircond installation and maintenance contractor with over 10 years experience.',
  },
  {
    slug: 'kedah-hvac',
    name_en: 'Kedah HVAC Specialist',
    name_zh: '吉打 HVAC 专家',
    contact: 'Mr. Lim',
    tel: '019-876 5432', whatsapp: '60198765432', email: 'hvac@example.com',
    address: '88, Jalan PKNK', city: 'Alor Setar', state: 'Kedah',
    service_area: 'Kedah & Perlis',
    service_types: 'HVAC Service,Project Work,Commercial Aircond,Industrial Aircond',
    featured: 1, status: 1,
    desc: 'HVAC contractor specialising in commercial and industrial air conditioning.',
  },
  {
    slug: 'cool-tech-contractor',
    name_en: 'Cool Tech Contractor',
    name_zh: '冷科技承包商',
    contact: 'Mr. Lee',
    tel: '011-2233 4455', whatsapp: '60112233445',
    address: 'Block A, Lorong 5', city: 'Kulim', state: 'Kedah',
    service_area: 'Northern Malaysia',
    service_types: 'Aircond Installation,Electrical Work,HVAC Service',
    featured: 0, status: 1,
    desc: 'Reliable installation & electrical services for residential and commercial projects.',
  },
];
const stmtPartner = db.prepare(
  `INSERT INTO technical_partners (slug, company_name_en, company_name_bm, company_name_zh,
     contact_person, telephone, whatsapp, email, address, city, state, country,
     service_area, service_types, display_order, featured, status,
     show_phone, show_whatsapp, show_email, show_address, show_website)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Malaysia', ?, ?, ?, ?, ?, 1, 1, 1, 1, 1)`
);
for (let i = 0; i < partners.length; i++) {
  const p = partners[i];
  await stmtPartner.run(
    p.slug, p.name_en, p.name_en, p.name_zh,
    p.contact ?? null, p.tel ?? null, p.whatsapp ?? null, p.email ?? null,
    p.address, p.city, p.state,
    p.service_area ?? null, p.service_types ?? null,
    i + 1, p.featured, p.status
  );
}

console.log('[seed] FAQs...');
const faqs = [
  { q_en: 'What products does ATORA supply?', a_en: 'We supply air conditioners, aircond parts, spare parts, accessories, installation materials and electrical components from leading brands.', category: 'General' },
  { q_en: 'Which aircond brands are available?', a_en: 'We supply Daikin, Midea, Panasonic, AUX, Acson, Haier, Hisense, Mitsubishi Electric, Topaire and more.' },
  { q_en: 'Do you sell aircond spare parts?', a_en: 'Yes — we stock a comprehensive range of compressors, PCB boards, fan motors, capacitors, sensors and more.' },
  { q_en: 'Do you offer wholesale pricing?', a_en: 'Yes. We offer competitive wholesale pricing for installers, contractors and bulk buyers.' },
  { q_en: 'Can I request a bulk quotation?', a_en: 'Yes — please submit a project enquiry via our Project Supply page or contact us directly.' },
  { q_en: 'Can I upload a photo to identify a spare part?', a_en: 'Yes — use our Quick Photo Enquiry on the homepage to upload a photo and we\'ll identify it for you.' },
  { q_en: 'Can I send a product video?', a_en: 'Yes — you can upload a short video along with your enquiry to help us understand the product.' },
  { q_en: 'Do you supply contractors?', a_en: 'Yes — we work closely with installers, HVAC contractors and electrical contractors.' },
  { q_en: 'Do you supply commercial projects?', a_en: 'Yes — we provide bulk quotations and project supply for commercial buildings, offices and developments.' },
  { q_en: 'Do you serve customers outside Kedah?', a_en: 'Yes — we serve customers nationwide across Malaysia, not only in Kedah.' },
  { q_en: 'Do you serve customers nationwide?', a_en: 'Yes — our service area is all of Malaysia, with branches in Padang Serai, Sungai Petani and Kulim.' },
  { q_en: 'Where are your branches?', a_en: 'Our HQ is in Padang Serai, with branches in Sungai Petani and Kulim (all in Kedah).' },
];
const stmtFaq = db.prepare(
  `INSERT INTO faqs (category, question_en, answer_en, display_order, status) VALUES (?, ?, ?, ?, 1)`
);
for (let i = 0; i < faqs.length; i++) {
  const f = faqs[i];
  await stmtFaq.run(f.category ?? 'General', f.q_en, f.a_en, i);
}

console.log('[seed] Homepage content sections...');
const sections = [
  {
    key: 'product_videos',
    title_en: 'Product Videos',
    title_bm: 'Video Produk',
    title_zh: '产品视频',
    subtitle_en: 'Watch product demonstrations and installation guides.',
    subtitle_bm: 'Tonton demonstrasi produk dan panduan pemasangan.',
    subtitle_zh: '观看产品演示及安装指南。',
    enabled: 1, image_url: '', video_url: '', display_order: 11,
  },
];
const stmtSec = db.prepare(
  `INSERT INTO homepage_content (section_key, enabled, title_en, title_bm, title_zh,
    subtitle_en, subtitle_bm, subtitle_zh, image_url, video_url, display_order)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(section_key) DO UPDATE SET enabled = excluded.enabled`
);
for (const s of sections) {
  await stmtSec.run(s.key, s.enabled, s.title_en, s.title_bm, s.title_zh, s.subtitle_en, s.subtitle_bm, s.subtitle_zh, s.image_url, s.video_url, s.display_order);
}

console.log('[seed] Products...');
function slugify(s) {
  return s.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
// brand & category references use slugs (resolved to ids via brandMap / catMap above)
const products = [
  { name: 'Midea 1.5HP Inverter Split Air Conditioner', brand: 'midea', cat: 'air-conditioners-split-unit', model: 'MSXF-12CRN', cap: '1.5HP / 12000 BTU', ptype: 'Inverter Split Unit', retail: 1199, wholesale: 999, promo: 1099, mode: 'SHOW_PROMOTION_PRICE', featured: 1, stock: 'in_stock', spec: 'Cooling 12000 BTU · Refrigerant R32 · 5-star energy · Sleep mode · Indoor noise ~24dB.', desc: 'Reliable and affordable 1.5HP inverter split unit ideal for bedrooms and small offices.' },
  { name: 'Daikin 2.0HP Inverter Split Air Conditioner', brand: 'daikin', cat: 'air-conditioners-split-unit', model: 'FTKF50W', cap: '2.0HP / 18000 BTU', ptype: 'Inverter Split Unit', retail: 1899, mode: 'SHOW_PRICE', featured: 1, stock: 'in_stock', spec: 'Cooling 18000 BTU · R32 · Inverter swing compressor · PM2.5 filter.', desc: 'Premium 2.0HP inverter split unit with Daikin efficiency and quiet operation.' },
  { name: 'Panasonic 1.0HP Inverter Split Air Conditioner', brand: 'panasonic', cat: 'air-conditioners-inverter', model: 'CS-XU10AKH', cap: '1.0HP / 9000 BTU', ptype: 'Inverter Split Unit', retail: 999, mode: 'SHOW_PRICE', stock: 'in_stock', spec: 'Cooling 9000 BTU · R32 · nanoe™ X purification.', desc: 'Compact 1.0HP inverter unit with Panasonic nanoe™ air purification.' },
  { name: 'AUX 1.5HP Non-Inverter Split Air Conditioner', brand: 'aux', cat: 'air-conditioners-non-inverter', model: 'KFR-35GW', cap: '1.5HP / 12000 BTU', ptype: 'Non-Inverter Split Unit', retail: 799, wholesale: 699, mode: 'SHOW_WHOLESALE_PRICE', stock: 'low_stock', spec: 'Cooling 12000 BTU · R410A · 3-speed fan.', desc: 'Value 1.5HP non-inverter split unit, popular for budget installations.' },
  { name: 'Acson 2.5HP Floor Standing Air Conditioner', brand: 'acson', cat: 'air-conditioners-floor-standing', model: 'MSP-F25', cap: '2.5HP / 24000 BTU', ptype: 'Floor Standing', retail: 2599, mode: 'SHOW_PRICE', featured: 1, stock: 'in_stock', spec: 'Cooling 24000 BTU · R32 · Wide-angle airflow.', desc: 'Powerful 2.5HP floor-standing unit for halls and commercial spaces.' },
  { name: 'Haier 1.5HP Smart Inverter Air Conditioner', brand: 'haier', cat: 'air-conditioners-split-unit', model: 'HSU-12TSV', cap: '1.5HP / 12000 BTU', ptype: 'Inverter Split Unit', retail: 1099, price_min: 999, price_max: 1199, mode: 'SHOW_PRICE_RANGE', featured: 1, stock: 'in_stock', spec: 'Cooling 12000 BTU · R32 · WiFi smart control.', desc: 'Smart 1.5HP inverter unit controllable from your phone.' },
  { name: 'Hisense 2.0HP Inverter Split Air Conditioner', brand: 'hisense', cat: 'air-conditioners-split-unit', model: 'AS-24UR4', cap: '2.0HP / 18000 BTU', ptype: 'Inverter Split Unit', retail: 1599, mode: 'CONTACT_FOR_PRICE', stock: 'in_stock', spec: 'Cooling 18000 BTU · R32 · Self-clean.', desc: 'Feature-rich 2.0HP inverter unit — contact us for project pricing.' },
  { name: 'Mitsubishi Electric 1.5HP Inverter Split', brand: 'mitsubishi-electric', cat: 'air-conditioners-split-unit', model: 'MSXY-FN12', cap: '1.5HP / 12000 BTU', ptype: 'Inverter Split Unit', retail: 2099, mode: 'SHOW_PRICE', featured: 1, stock: 'in_stock', spec: 'Cooling 12000 BTU · R32 · Dual-barrier coating.', desc: 'Industry-leading 1.5HP inverter unit from Mitsubishi Electric.' },
  { name: 'Topaire 1.0HP Non-Inverter Split Air Conditioner', brand: 'topaire', cat: 'air-conditioners-non-inverter', model: 'TA-10N', cap: '1.0HP / 9000 BTU', ptype: 'Non-Inverter Split Unit', retail: 699, mode: 'SHOW_PRICE', stock: 'in_stock', spec: 'Cooling 9000 BTU · R410A.', desc: 'Entry-level 1.0HP non-inverter unit for basic cooling needs.' },
  { name: 'Universal Aircond Compressor 1.5HP', brand: null, cat: 'aircond-parts-compressor', model: 'QXR-30', cap: '1.5HP', ptype: 'Spare Part', retail: 450, mode: 'SHOW_PRICE', stock: 'in_stock', spec: 'Rotary compressor · R22/R410A · 1.5HP.', desc: 'Universal replacement rotary compressor suitable for most 1.5HP units.' },
  { name: 'Aircond PCB Control Board', brand: null, cat: 'aircond-parts-pcb-board', model: 'PCB-UNIV', cap: 'Universal', ptype: 'Spare Part', retail: 180, mode: 'SHOW_PRICE', stock: 'in_stock', spec: 'Main control board · multi-brand compatible.', desc: 'Universal main PCB control board for split-unit air conditioners.' },
  { name: 'Indoor Fan Motor 1/2HP', brand: null, cat: 'aircond-parts-fan-motor', model: 'FM-05', cap: '1/2HP', ptype: 'Spare Part', retail: 120, mode: 'SHOW_PRICE', stock: 'in_stock', spec: 'Indoor fan motor · 1/2HP · 3-wire.', desc: 'Replacement indoor fan motor for residential split units.' },
  { name: 'Copper Pipe Set 1/4" + 3/8" Insulated', brand: null, cat: 'installation-materials-copper-pipe', model: 'CP-SET', cap: 'Per meter', ptype: 'Installation Material', retail: 25, mode: 'SHOW_PRICE', stock: 'in_stock', spec: 'Pre-insulated copper pipe pair · 1/4" + 3/8".', desc: 'Insulated copper pipe pair sold per meter for split-unit installation.' },
  { name: 'Aircond Wall Bracket 1.5HP', brand: null, cat: 'installation-materials-bracket', model: 'BRK-15', cap: '1.5HP', ptype: 'Installation Material', retail: 35, mode: 'SHOW_PRICE', stock: 'in_stock', spec: 'Galvanised wall bracket · 1.5HP rating.', desc: 'Sturdy galvanised outdoor unit wall bracket.' },
  { name: 'Aircond Cleaning Foam 500ml', brand: null, cat: 'maintenance-products-cleaning-accessories', model: 'CLN-FOAM', cap: '500ml', ptype: 'Maintenance Product', retail: 18, mode: 'SHOW_PRICE', stock: 'in_stock', spec: 'Active foam cleaner · 500ml.', desc: 'Effective active-foam cleaner for coils and filters.' },
];
const stmtProd = db.prepare(
  `INSERT INTO products (slug, sku, name_en, name_bm, name_zh, brand_id, category_id, model, capacity, product_type,
     description_en, description_bm, description_zh, specifications, stock_status,
     retail_price, wholesale_price, promotion_price, price_min, price_max, currency, price_display_mode, featured, status,
     seo_title_en, seo_description_en)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RM', ?, ?, 1, ?, ?)`
);
const usedSlugs = new Set();
for (let i = 0; i < products.length; i++) {
  const p = products[i];
  let slug = slugify(p.name);
  while (usedSlugs.has(slug)) slug = `${slug}-${i}`;
  usedSlugs.add(slug);
  const brandId = p.brand ? (brandMap[p.brand] ?? null) : null;
  const catId = catMap[p.cat];
  if (!catId) throw new Error(`Seed error: category slug not found: ${p.cat}`);
  await stmtProd.run(
    slug, p.sku ?? null, p.name, p.name, p.name, brandId, catId, p.model ?? null, p.cap ?? null, p.ptype ?? null,
    p.desc, p.desc, p.desc, p.spec ?? null, p.stock || 'in_stock',
    p.retail ?? null, p.wholesale ?? null, p.promo ?? null, p.price_min ?? null, p.price_max ?? null,
    p.mode || 'SHOW_PRICE', p.featured ? 1 : 0,
    `ATORA — ${p.name}`, p.desc
  );
}

console.log('[seed] Product media (sample primary images)...');
const mediaSeed = [
  { name: 'Midea 1.5HP Inverter Split Air Conditioner', url: 'https://placehold.co/600x600?text=Midea+1.5HP', alt: 'Midea 1.5HP inverter split unit' },
  { name: 'Daikin 2.0HP Inverter Split Air Conditioner', url: 'https://placehold.co/600x600?text=Daikin+2.0HP', alt: 'Daikin 2.0HP inverter split unit' },
  { name: 'Acson 2.5HP Floor Standing Air Conditioner', url: 'https://placehold.co/600x600?text=Acson+2.5HP', alt: 'Acson 2.5HP floor standing unit' },
  { name: 'Mitsubishi Electric 1.5HP Inverter Split', url: 'https://placehold.co/600x600?text=Mitsubishi+1.5HP', alt: 'Mitsubishi Electric 1.5HP inverter split' },
];
const stmtMedia = db.prepare(
  `INSERT INTO product_media (product_id, type, url, alt_text, display_order, is_primary, is_featured)
   VALUES ((SELECT id FROM products WHERE name_en = ?), 'image', ?, ?, 1, 1, 0)`
);
for (const m of mediaSeed) await stmtMedia.run(m.name, m.url, m.alt);

console.log('[seed] Done!');
console.log('');
console.log('  Admin login: ' + (process.env.ADMIN_DEFAULT_EMAIL || 'admin@atora.com.my'));
console.log('  Admin password: ' + (process.env.ADMIN_DEFAULT_PASSWORD || 'Atora@2026'));
console.log('  Start the site: npm run dev');
console.log('  Visit: http://localhost:3000');
await db.close();
