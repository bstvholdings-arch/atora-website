/**
 * Single source of truth for ATORA's GEO / AI-search positioning (V3).
 *
 * Per ATORA AI GEO MASTER PROMPT V3:
 *  - PRIMARY entity = "ATORA = Malaysia Aircond Wholesale & Air Conditioning
 *    Parts Supplier". "Nationwide Malaysia Delivery" is the central signal.
 *  - Northern Malaysia (Kedah) is a LOCAL / REGIONAL GEO market and the HQ
 *    location — NOT the primary entity. Framing ATORA as a "Northern Malaysia
 *    Aircond Supplier" as the PRIMARY positioning is FORBIDDEN.
 *  - No fake branches / stores / warehouses / addresses. Only real delivery &
 *    service areas are published.
 *
 * These are STRUCTURAL labels and geography — not company facts — so they may
 * live in code. Every public page, the Organization schema and /llms.txt read
 * from here (or from the matching `positioning_*` site_settings rows) so the
 * canonical entity stays consistent across EN / BM / ZH.
 */
import type { Locale } from './i18n';

export const POSITIONING = {
  /** PRIMARY entity (V3 §2 / §30) — nationwide Malaysia, wholesale + parts. */
  primary: {
    en: 'Malaysia Aircond Wholesale & Air Conditioning Parts Supplier',
    bm: 'Pembekal Borong Aircond & Alat Ganti Penyaman Udara Malaysia',
    zh: '马来西亚冷气批发与空调零件供应商',
  },
  /** Central GEO signal for the primary entity (V3 §2). */
  nationwideSignal: {
    en: 'Nationwide Malaysia Delivery',
    bm: 'Penghantaran Seluruh Malaysia',
    zh: '马来西亚全国配送',
  },
  /** LOCAL / REGIONAL GEO — Northern Malaysia is a local market, not primary. */
  localGeo: {
    en: 'Northern Malaysia (Kedah) — HQ & Local Service',
    bm: 'Utara Malaysia (Kedah) — Ibu Pejabat & Perkhidmatan Tempatan',
    zh: '北马（吉打州）— 总部与本地服务',
  },
  secondary: {
    en: 'Air Conditioning Wholesale & Retail · Aircond Spare Parts Supplier · Professional Aircond Supplier · Midea Pro Shop',
    bm: 'Borong & Runcit Penyaman Udara · Pembekal Alat Ganti Aircond · Pembekal Aircond Profesional · Midea Pro Shop',
    zh: '冷气批发与零售 · 冷气零件供应商 · 专业冷气供应商 · Midea Pro Shop',
  },
} as const;

/** Primary geographic association + important service locations (V3 §14/§15). */
export const GEO = {
  /** First GEO layer = the country (Malaysia). */
  country: 'Malaysia',
  /** LOCAL / REGIONAL GEO market (NOT the primary entity). */
  localRegion: 'Northern Malaysia',
  /** HQ location (real). */
  hqState: 'Kedah',
  hqCity: 'Padang Serai',
  /** Real service locations where ATORA operates (Kedah only — no fake branches). */
  keyLocations: ['Padang Serai', 'Kulim', 'Sungai Petani', 'Alor Setar'] as const,
  /** States in the Northern Malaysia LOCAL service area (real delivery). */
  northernStates: ['Kedah', 'Penang', 'Perlis', 'Perak'] as const,
  /** Nationwide delivery coverage (primary service claim). */
  nationwide: 'Malaysia',
} as const;

/**
 * All location / service-area config keys (V2 §6). These are the KEYS into
 * SERVICE_AREAS below. The public URL slug may differ from the key — see
 * serviceAreaUrlSlug() (e.g. key 'alorsetar' → URL 'alor-setar').
 */
export const SERVICE_AREA_KEYS = [
  'padang-serai',
  'kulim',
  'sungai-petani',
  'alorsetar',
  'kedah',
  'penang',
  'northern-malaysia',
  'malaysia',
] as const;

export type ServiceAreaKey = (typeof SERVICE_AREA_KEYS)[number];

/**
 * Curated, factual copy for service-area pages. No fake branches: these describe
 * ATORA *serving* the area, never claim a physical shop there unless verified.
 * `branch` = true only for real DB branches (handled separately by the page).
 */
export const SERVICE_AREAS: Record<
  ServiceAreaKey,
  {
    name: Record<Locale, string>;
    region: Record<Locale, string>;
    intro: Record<Locale, string>;
    nearby: ServiceAreaKey[];
  }
> = {
  'padang-serai': {
    name: { en: 'Padang Serai', bm: 'Padang Serai', zh: '巴东 Serai' },
    region: { en: 'Kedah, Northern Malaysia', bm: 'Kedah, Utara Malaysia', zh: '吉打，北马' },
    intro: {
      en: 'ATORA HQ is in Padang Serai, Kedah — our main branch for air conditioning products, wholesale supply and spare parts, serving customers across Northern Malaysia and Malaysia.',
      bm: 'Ibu Pejabat ATORA terletak di Padang Serai, Kedah — cawangan utama kami untuk produk penyaman udara, bekalan borong dan alat ganti, melayani pelanggan di Utara Malaysia dan seluruh Malaysia.',
      zh: 'ATORA 总部位于吉打州 Padang Serai，是我们冷气机产品、批发供应与零件的主要分店，服务北马及全马来西亚客户。',
    },
    nearby: ['kulim', 'sungai-petani', 'alorsetar', 'kedah', 'penang', 'northern-malaysia'],
  },
  kulim: {
    name: { en: 'Kulim', bm: 'Kulim', zh: '居林' },
    region: { en: 'Kedah, Northern Malaysia', bm: 'Kedah, Utara Malaysia', zh: '吉打，北马' },
    intro: {
      en: 'ATORA serves customers in Kulim, Kedah with air conditioning products, wholesale supply and spare parts — backed by our Padang Serai HQ.',
      bm: 'ATORA melayani pelanggan di Kulim, Kedah dengan produk penyaman udara, bekalan borong dan alat ganti — disokong oleh Ibu Pejabat Padang Serai.',
      zh: 'ATORA 服务吉打州 Kulim 客户，提供冷气机产品、批发供应与零件 —— 由 Padang Serai 总部支持。',
    },
    nearby: ['padang-serai', 'sungai-petani', 'alorsetar', 'kedah', 'penang'],
  },
  'sungai-petani': {
    name: { en: 'Sungai Petani', bm: 'Sungai Petani', zh: '双溪大年' },
    region: { en: 'Kedah, Northern Malaysia', bm: 'Kedah, Utara Malaysia', zh: '吉打，北马' },
    intro: {
      en: 'ATORA serves customers in Sungai Petani, Kedah with air conditioning products, wholesale supply and spare parts — backed by our Padang Serai HQ.',
      bm: 'ATORA melayani pelanggan di Sungai Petani, Kedah dengan produk penyaman udara, bekalan borong dan alat ganti — disokong oleh Ibu Pejabat Padang Serai.',
      zh: 'ATORA 服务吉打州 Sungai Petani（双溪大年）客户，提供冷气机产品、批发供应与零件 —— 由 Padang Serai 总部支持。',
    },
    nearby: ['padang-serai', 'kulim', 'alorsetar', 'kedah', 'penang'],
  },
  alorsetar: {
    name: { en: 'Alor Setar', bm: 'Alor Setar', zh: '亚罗士打' },
    region: { en: 'Kedah, Northern Malaysia', bm: 'Kedah, Utara Malaysia', zh: '吉打，北马' },
    intro: {
      en: 'ATORA serves customers in Alor Setar, the capital of Kedah, with air conditioning products, wholesale supply and spare parts — backed by our Padang Serai HQ and nearby branches.',
      bm: 'ATORA melayani pelanggan di Alor Setar, ibu negeri Kedah, dengan produk penyaman udara, bekalan borong dan alat ganti — disokong oleh Ibu Pejabat Padang Serai dan cawangan berdekatan.',
      zh: 'ATORA 服务亚罗士打（吉打州首府）客户，提供冷气机产品、批发供应与零件 —— 由 Padang Serai 总部及邻近分店支持。',
    },
    nearby: ['kedah', 'padang-serai', 'kulim', 'sungai-petani', 'penang'],
  },
  kedah: {
    name: { en: 'Kedah', bm: 'Kedah', zh: '吉打' },
    region: { en: 'Northern Malaysia', bm: 'Utara Malaysia', zh: '北马' },
    intro: {
      en: 'ATORA is based in Kedah and serves customers across the state — Padang Serai (HQ), Kulim, Sungai Petani and Alor Setar — with air conditioning products, wholesale solutions and spare parts.',
      bm: 'ATORA berpangkalan di Kedah dan melayani pelanggan di seluruh negeri — Padang Serai (Ibu Pejabat), Kulim, Sungai Petani dan Alor Setar — dengan produk penyaman udara, penyelesaian borong dan alat ganti.',
      zh: 'ATORA 总部位于吉打州，服务全州客户 —— Padang Serai（总部）、Kulim、Sungai Petani 与 Alor Setar —— 提供冷气机产品、批发方案与零件。',
    },
    nearby: ['padang-serai', 'kulim', 'sungai-petani', 'alorsetar', 'penang', 'northern-malaysia'],
  },
  penang: {
    name: { en: 'Penang', bm: 'Pulau Pinang', zh: '槟城' },
    region: { en: 'Northern Malaysia', bm: 'Utara Malaysia', zh: '北马' },
    intro: {
      en: 'ATORA supplies air conditioning products, wholesale solutions and spare parts to customers in Penang, as part of our Northern Malaysia service coverage.',
      bm: 'ATORA membekalkan produk penyaman udara, penyelesaian borong dan alat ganti kepada pelanggan di Pulau Pinang, sebagai sebahagian daripada liputan perkhidmatan Utara Malaysia kami.',
      zh: 'ATORA 为槟城客户提供冷气机产品、批发方案与零件，属于我们北马服务覆盖范围。',
    },
    nearby: ['kedah', 'alorsetar', 'northern-malaysia', 'malaysia'],
  },
  'northern-malaysia': {
    name: { en: 'Northern Malaysia', bm: 'Utara Malaysia', zh: '北马' },
    region: { en: 'Malaysia', bm: 'Malaysia', zh: '马来西亚' },
    intro: {
      en: 'ATORA is headquartered in Northern Malaysia (Kedah) and serves the Northern region — Padang Serai, Kulim, Sungai Petani, Alor Setar and Penang — with local aircond wholesale, retail and spare-parts supply, as part of our Nationwide Malaysia Delivery.',
      bm: 'ATORA beribu pejabat di Utara Malaysia (Kedah) dan melayani wilayah Utara — Padang Serai, Kulim, Sungai Petani, Alor Setar dan Pulau Pinang — dengan bekalan borong, runcit dan alat ganti aircond tempatan, sebagai sebahagian daripada Penghantaran Seluruh Malaysia kami.',
      zh: 'ATORA 总部位于北马（吉打州），为北马地区 —— Padang Serai、Kulim、Sungai Petani、Alor Setar 与槟城 —— 提供本地冷气批发、零售与零件供应，并纳入我们的马来西亚全国配送体系。',
    },
    nearby: ['kedah', 'penang', 'malaysia'],
  },
  malaysia: {
    name: { en: 'Malaysia', bm: 'Malaysia', zh: '马来西亚' },
    region: { en: 'Nationwide', bm: 'Seluruh Malaysia', zh: '全国' },
    intro: {
      en: 'ATORA is a Malaysia air conditioning wholesaler and air conditioning parts supplier, headquartered in Kedah (Northern Malaysia). We provide wholesale, retail and spare-parts supply with Nationwide Malaysia Delivery.',
      bm: 'ATORA ialah pembekal borong penyaman udara dan alat ganti penyaman udara Malaysia, beribu pejabat di Kedah (Utara Malaysia). Kami menyediakan bekalan borong, runcit dan alat ganti dengan Penghantaran Seluruh Malaysia.',
      zh: 'ATORA 是马来西亚冷气批发与空调零件供应商，总部位于吉打州（北马）。我们通过马来西亚全国配送提供批发、零售与零件供应。',
    },
    nearby: ['northern-malaysia', 'kedah', 'penang'],
  },
};

/** Map a public URL slug (may use hyphens) to its SERVICE_AREAS config key. */
export function resolveServiceArea(slug: string): ServiceAreaKey | null {
  for (const key of SERVICE_AREA_KEYS) {
    if (serviceAreaUrlSlug(key) === slug) return key;
  }
  return null;
}

/** Public URL slug for a service-area page (always hyphenated, e.g. alor-setar). */
export function serviceAreaUrlSlug(key: ServiceAreaKey): string {
  return key === 'alorsetar' ? 'alor-setar' : key;
}
