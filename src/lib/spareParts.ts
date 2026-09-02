/**
 * ATORA — Data-Driven Spare Parts GEO (ATORA AI GEO MASTER PROMPT V3 §4–§11, §32)
 * =====================================================================================
 *
 * Goal: map ACTUAL on-site spare-part products → a standard set of GEO categories
 * using AI-style semantic recognition of product names (EN / BM / ZH + abbreviations),
 * without EVER renaming a real product for SEO.
 *
 * Rules (per V3):
 *  - Source of truth = the LIVE product database. Only products that actually exist
 *    on the site are classified. The taxonomy below is a *classification dictionary*,
 *    not a list of products to invent.
 *  - Hard cap of 100 standard categories (V3 §4). We are far below it.
 *  - Each mapping records a confidence (HIGH / MEDIUM / LOW) and an `adminVerified`
 *    flag. Real products are never renamed — we only ADD a GEO category label.
 */
import type { Locale } from './i18n';
import { data } from './data';

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SparePartCategory {
  /** Stable key, also the canonical GEO category id. */
  key: string;
  /** Canonical standard GEO category name per locale. */
  standardName: Record<Locale, string>;
  /** Matching DB category slug under the AIRCOND PARTS tree (if any). */
  dbCategorySlug?: string;
  /**
   * AI semantic aliases used to recognise an actual product name. Covers EN / BM /
   * ZH surface forms plus common abbreviations. More aliases = more robust recall.
   */
  aliases: {
    en: string[];
    bm: string[];
    zh: string[];
    abbr: string[];
  };
  /** Classification confidence for this standard category. */
  confidence: Confidence;
  /** Set true once a human admin has verified the mapping. */
  adminVerified: boolean;
  /** Short, factual GEO description used in structured data / llms. */
  description: Record<Locale, string>;
}

/**
 * Canonical spare-parts GEO taxonomy. Derived from the AIRCOND PARTS category
 * tree in the live product DB — only categories ATORA actually stocks are
 * included. This is the single source of truth for spare-part GEO classification.
 */
export const STANDARD_SPARE_PART_CATEGORIES: SparePartCategory[] = [
  {
    key: 'compressor',
    standardName: { en: 'Air Conditioner Compressor', bm: 'Kompresor Penyaman Udara', zh: '空调压缩机' },
    dbCategorySlug: 'aircond-parts-compressor',
    aliases: {
      en: ['compressor', 'rotary compressor', 'scroll compressor', 'reciprocating compressor'],
      bm: ['kompresor', 'kompresor rotary', 'kompresor skrol'],
      zh: ['压缩机', '压缩器'],
      abbr: ['COMP', 'COMPRESSOR'],
    },
    confidence: 'HIGH',
    adminVerified: false,
    description: {
      en: 'Replacement compressors for split, window and commercial air conditioners.',
      bm: 'Kompresor ganti untuk penyaman udara split, tingkap dan komersial.',
      zh: '适用于分体、窗式及商用空调的替换压缩机。',
    },
  },
  {
    key: 'pcb-board',
    standardName: { en: 'Air Conditioner PCB Control Board', bm: 'Papan Kawalan PCB Penyaman Udara', zh: '空调 PCB 控制板' },
    dbCategorySlug: 'aircond-parts-pcb-board',
    aliases: {
      en: ['pcb', 'pcb board', 'control board', 'main board', 'main control board', 'circuit board', 'motherboard', 'inverter board'],
      bm: ['pcb', 'papan kawalan', 'papan litar', 'papan utama'],
      zh: ['电路板', '控制板', '主板', '变频板'],
      abbr: ['PCB', 'MCB'],
    },
    confidence: 'HIGH',
    adminVerified: false,
    description: {
      en: 'Main and inverter PCB control boards for air conditioner indoor and outdoor units.',
      bm: 'Papan kawalan PCB utama dan inverter untuk unit dalaman dan luaran.',
      zh: '空调室内外机的主板与变频控制板。',
    },
  },
  {
    key: 'fan-motor',
    standardName: { en: 'Air Conditioner Fan Motor', bm: 'Motor Kipas Penyaman Udara', zh: '空调风扇电机' },
    dbCategorySlug: 'aircond-parts-fan-motor',
    aliases: {
      en: ['fan motor', 'indoor fan motor', 'outdoor fan motor', 'blower motor', 'motor'],
      bm: ['motor kipas', 'motor peminat', 'motor dalaman', 'motor luaran'],
      zh: ['风扇电机', '风机电机', '马达', '电机'],
      abbr: ['FM', 'MOTOR'],
    },
    confidence: 'HIGH',
    adminVerified: false,
    description: {
      en: 'Indoor and outdoor fan motors for residential and commercial units.',
      bm: 'Motor kipas dalaman dan luaran untuk unit kediaman dan komersial.',
      zh: '家用与商用空调的室内外风扇电机。',
    },
  },
  {
    key: 'capacitor',
    standardName: { en: 'Air Conditioner Capacitor', bm: 'Kapasitor Penyaman Udara', zh: '空调电容' },
    dbCategorySlug: 'aircond-parts-capacitor',
    aliases: {
      en: ['capacitor', 'start capacitor', 'run capacitor', 'fan capacitor', 'compressor capacitor'],
      bm: ['kapasitor', 'kapasitor mula', 'kapasitor jalan'],
      zh: ['电容', '电容器', '启动电容', '运行电容'],
      abbr: ['CAP', 'CAPACITOR'],
    },
    confidence: 'HIGH',
    adminVerified: false,
    description: {
      en: 'Start and run capacitors for air conditioner compressors and fan motors.',
      bm: 'Kapasitor mula dan jalan untuk kompresor dan motor kipas.',
      zh: '空调压缩机与风扇电机的启动/运行电容。',
    },
  },
  {
    key: 'sensor',
    standardName: { en: 'Air Conditioner Sensor', bm: 'Sensor Penyaman Udara', zh: '空调传感器' },
    dbCategorySlug: 'aircond-parts-sensor',
    aliases: {
      en: ['sensor', 'temperature sensor', 'thermistor', 'pressure sensor', 'room sensor'],
      bm: ['sensor', 'pengesan suhu', 'termostor'],
      zh: ['传感器', '感温头', '热敏电阻', '温控探头'],
      abbr: ['SENS', 'SENSOR'],
    },
    confidence: 'MEDIUM',
    adminVerified: false,
    description: {
      en: 'Temperature and pressure sensors / thermistors for air conditioners.',
      bm: 'Sensor suhu dan tekanan / termistor untuk penyaman udara.',
      zh: '空调的温度与压力传感器/热敏电阻。',
    },
  },
  {
    key: 'thermostat',
    standardName: { en: 'Air Conditioner Thermostat', bm: 'Termostat Penyaman Udara', zh: '空调温控器' },
    dbCategorySlug: 'aircond-parts-thermostat',
    aliases: {
      en: ['thermostat', 'temperature controller', 'temp controller'],
      bm: ['termostat', 'kawalan suhu'],
      zh: ['温控器', '温控开关', '温度控制器'],
      abbr: ['TSTAT', 'THRM'],
    },
    confidence: 'MEDIUM',
    adminVerified: false,
    description: {
      en: 'Wall and in-unit thermostats / temperature controllers.',
      bm: 'Termostat dinding dan dalam unit.',
      zh: '壁挂与机内温控器/温度控制器。',
    },
  },
  {
    key: 'relay',
    standardName: { en: 'Air Conditioner Relay', bm: 'Relay Penyaman Udara', zh: '空调继电器' },
    dbCategorySlug: 'aircond-parts-relay',
    aliases: {
      en: ['relay', 'power relay', 'control relay'],
      bm: ['relay', 'relay kuasa'],
      zh: ['继电器', '控制继电器'],
      abbr: ['RLY', 'RELAY'],
    },
    confidence: 'MEDIUM',
    adminVerified: false,
    description: {
      en: 'Control and power relays for air conditioner circuits.',
      bm: 'Relay kawalan dan kuasa untuk litar penyaman udara.',
      zh: '空调电路的控制与功率继电器。',
    },
  },
  {
    key: 'contactor',
    standardName: { en: 'Air Conditioner Contactor', bm: 'Pengubah Suaian Penyaman Udara', zh: '空调接触器' },
    dbCategorySlug: 'aircond-parts-contactor',
    aliases: {
      en: ['contactor', 'power contactor', 'ac contactor'],
      bm: ['pengubah suai kuasa', 'pengubah suai'],
      zh: ['接触器', '交流接触器'],
      abbr: ['CONT', 'CONTACTOR'],
    },
    confidence: 'MEDIUM',
    adminVerified: false,
    description: {
      en: 'Power contactors for outdoor unit compressors and fans.',
      bm: 'Pengubah suai kuasa untuk kompresor dan kipas unit luaran.',
      zh: '外机压缩机与风扇的功率接触器。',
    },
  },
  {
    key: 'electrical-components',
    standardName: { en: 'Air Conditioner Electrical Components', bm: 'Komponen Elektrik Penyaman Udara', zh: '空调电子元件' },
    dbCategorySlug: 'aircond-parts-electrical-components',
    aliases: {
      en: ['electrical components', 'wiring', 'connector', 'fuse', 'terminal block', 'electrical parts'],
      bm: ['komponen elektrik', 'pendawaian', 'penyambung', 'fius'],
      zh: ['电子元件', '接线', '接插件', '保险丝', '端子'],
      abbr: ['ELEC', 'ELECT'],
    },
    confidence: 'MEDIUM',
    adminVerified: false,
    description: {
      en: 'Wiring, connectors, fuses and other electrical components.',
      bm: 'Pendawaian, penyambung, fius dan komponen elektrik lain.',
      zh: '接线、接插件、保险丝等电子元件。',
    },
  },
  {
    key: 'replacement-parts',
    standardName: { en: 'Air Conditioner Replacement Parts', bm: 'Alat Ganti Penyaman Udara', zh: '空调替换零件' },
    dbCategorySlug: 'aircond-parts-replacement-parts',
    aliases: {
      en: ['replacement parts', 'spare parts', 'spare part', 'generic parts', 'universal parts'],
      bm: ['alat ganti', 'alat ganti universal'],
      zh: ['替换零件', '零件', '配件', '通用件'],
      abbr: ['RPL', 'SPARE'],
    },
    confidence: 'MEDIUM',
    adminVerified: false,
    description: {
      en: 'General replacement and spare parts for air conditioners.',
      bm: 'Alat ganti am untuk penyaman udara.',
      zh: '空调通用替换与备件。',
    },
  },
];

export interface SparePartClassification {
  /** Real product id (never changed). */
  productId: number;
  /** Real product name, exactly as stored — NEVER renamed for SEO. */
  productName: string;
  /** DB category slug the product lives in. */
  dbCategorySlug: string | null;
  /** Resolved standard GEO category key. */
  categoryKey: string;
  /** Canonical standard GEO category name. */
  standardName: Record<Locale, string>;
  /** Classification confidence. */
  confidence: Confidence;
  /** The alias / abbreviation that triggered the semantic match (null = slug-based). */
  matchedTerm: string | null;
  adminVerified: boolean;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Classify one actual product into a standard GEO spare-part category.
 *
 * Two recognition paths:
 *  1. Direct DB-category-slug mapping (most reliable → HIGH confidence).
 *  2. Semantic name recognition across EN / BM / ZH + abbreviations.
 *
 * Returns null when nothing matches (the product is not a recognised spare part).
 */
export function classifySparePart(input: {
  name: string;
  categorySlug?: string | null;
}): SparePartClassification | null {
  // Path 1 — DB category slug → standard category.
  if (input.categorySlug) {
    const direct = STANDARD_SPARE_PART_CATEGORIES.find((c) => c.dbCategorySlug === input.categorySlug);
    if (direct) {
      return {
        productId: 0,
        productName: input.name,
        dbCategorySlug: input.categorySlug,
        categoryKey: direct.key,
        standardName: direct.standardName,
        confidence: 'HIGH',
        matchedTerm: input.categorySlug,
        adminVerified: direct.adminVerified,
      };
    }
  }

  // Path 2 — semantic name recognition.
  const n = normalize(input.name);
  if (!n) return null;
  let best: { cat: SparePartCategory; score: number; term: string } | null = null;
  for (const cat of STANDARD_SPARE_PART_CATEGORIES) {
    const terms = [
      ...cat.aliases.en.map((t) => ({ t, w: 2 })),
      ...cat.aliases.bm.map((t) => ({ t, w: 1.6 })),
      ...cat.aliases.zh.map((t) => ({ t, w: 1.6 })),
      ...cat.aliases.abbr.map((t) => ({ t, w: 3 })),
    ];
    for (const { t, w } of terms) {
      const nt = normalize(t);
      if (!nt) continue;
      if (n.includes(nt)) {
        const score = w * (nt.length >= 3 ? 1.2 : 1);
        if (!best || score > best.score) best = { cat, score, term: t };
      }
    }
  }
  if (!best) return null;
  return {
    productId: 0,
    productName: input.name,
    dbCategorySlug: input.categorySlug ?? null,
    categoryKey: best.cat.key,
    standardName: best.cat.standardName,
    confidence: best.cat.confidence,
    matchedTerm: best.term,
    adminVerified: best.cat.adminVerified,
  };
}

export interface SparePartsGEO {
  /** Number of ACTUAL spare-part products classified (never padded). */
  total: number;
  /** Distinct standard GEO categories represented by on-site products. */
  categoriesRepresented: string[];
  classifications: SparePartClassification[];
  /** Total standard categories defined (the §4 cap is 100). */
  taxonomySize: number;
}

/**
 * Build the live Spare Parts GEO classification from the product database.
 * Only products whose category lives under the AIRCOND PARTS tree are
 * classified — installation materials and maintenance products are excluded
 * unless they are spare parts. Real product names are preserved verbatim.
 */
export async function buildSparePartsGEO(): Promise<SparePartsGEO> {
  const [products, categories] = await Promise.all([
    data.listActiveProducts(),
    data.listActiveCategories(),
  ]);
  const slugById = new Map<number, string>();
  for (const c of categories) slugById.set(c.id, c.slug);

  const classifications: SparePartClassification[] = [];
  for (const p of products) {
    const catSlug = p.category_id != null ? slugById.get(p.category_id) : undefined;
    if (!catSlug || !catSlug.startsWith('aircond-parts-')) continue; // only ACTUAL spare parts
    const cls = classifySparePart({ name: p.name_en, categorySlug: catSlug });
    if (!cls) continue;
    classifications.push({ ...cls, productId: p.id });
  }

  const categoriesRepresented = [...new Set(classifications.map((c) => c.categoryKey))];
  return {
    total: classifications.length,
    categoriesRepresented,
    classifications,
    taxonomySize: STANDARD_SPARE_PART_CATEGORIES.length,
  };
}
