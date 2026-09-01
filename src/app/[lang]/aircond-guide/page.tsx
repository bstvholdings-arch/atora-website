/**
 * /aircond-guide — content hub (GEO V2 §7).
 *
 * Lists all editorial buying / care guides. Content is data-driven from
 * src/lib/guides.ts; adding a guide needs no page-code change. Every guide
 * cross-links to real catalogue / brand / parts / service-area routes.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { LOCALES, Locale, t } from '@/lib/i18n';
import { getAllSettings } from '@/lib/settings';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, itemListSchema, webPageSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import { GUIDES } from '@/lib/guides';

export const dynamic = 'force-dynamic';

const HUB_PATH = '/aircond-guide';

const TITLE_BY_LANG: Record<Locale, string> = {
  en: 'Aircond Guides & Buying Advice — ATORA',
  bm: 'Panduan & Nasihat Pembelian Aircond — ATORA',
  zh: '冷气选购与保养指南 — ATORA',
};
const DESC_BY_LANG: Record<Locale, string> = {
  en: 'Practical aircond buying and care guides for Malaysian homes — sizing in HP, inverter vs non-inverter, bedroom units, Kedah buying notes, spare parts, Midea and maintenance.',
  bm: 'Panduan pembelian dan penjagaan aircond yang praktikal untuk rumah Malaysia — saiz HP, inverter vs bukan inverter, unit bilik tidur, nota pembelian Kedah, alat ganti, Midea dan penyelenggaraan.',
  zh: '马来西亚家庭实用的冷气选购与保养指南 —— 匹数选择、变频与定频、卧室机型、吉打购买建议、零件、Midea 与日常保养。',
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  return buildPageMetadata({ lang, path: `/${lang}${HUB_PATH}`, title: TITLE_BY_LANG[lang], description: DESC_BY_LANG[lang] });
}

export default async function AircondGuideHub({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  await getAllSettings();

  const jsonLd = [
    breadcrumbSchema(`/${lang}${HUB_PATH}`, [
      { name: t(lang, 'nav.home'), url: `/${lang}` },
      { name: lang === 'zh' ? '冷气指南' : lang === 'bm' ? 'Panduan Aircond' : 'Aircond Guides', url: `/${lang}${HUB_PATH}` },
    ]),
    itemListSchema({
      path: `/${lang}${HUB_PATH}`,
      name: 'Aircond guides and buying advice from ATORA',
      items: GUIDES.map((g) => ({ name: g.title[lang], url: `/${lang}${HUB_PATH}/${g.slug}` })),
    }),
    webPageSchema({ lang, path: `/${lang}${HUB_PATH}`, title: TITLE_BY_LANG[lang] }),
  ];

  return (
    <div>
      <JsonLd id="aircond-guide-hub" data={jsonLd} />

      <section className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="container-fluid py-14">
          <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-4 ring-1 ring-white/20">
            {lang === 'zh' ? '北马专业冷气专门店' : lang === 'bm' ? 'Pakar Aircond Utara Malaysia' : 'Northern Malaysia Aircond Specialist'}
          </span>
          <h1 className="heading-1 text-white mb-4 max-w-4xl">
            {lang === 'zh' ? '冷气选购与保养指南' : lang === 'bm' ? 'Panduan & Nasihat Pembelian Aircond' : 'Aircond Guides & Buying Advice'}
          </h1>
          <p className="opacity-95 max-w-3xl text-lg leading-relaxed">
            {lang === 'zh'
              ? '由 ATORA（北马专业冷气专门店）整理的实用指南，帮助马来西亚家庭选对冷气、用得安心。'
              : lang === 'bm'
                ? 'Panduan praktikal dari ATORA (pakar aircond Utara Malaysia) untuk membantu rumah Malaysia memilih dan menggunakan aircond dengan betul.'
                : 'Practical guides from ATORA (Northern Malaysia Aircond Specialist) to help Malaysian homes choose and care for their air conditioner.'}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-fluid">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GUIDES.map((g) => (
              <Link key={g.slug} href={`/${lang}${HUB_PATH}/${g.slug}`} className="card p-6 hover:border-brand-300 transition group flex flex-col">
                <h2 className="heading-3 text-brand-900 mb-2 group-hover:text-brand-700">{g.title[lang]}</h2>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">{g.excerpt[lang]}</p>
                <span className="mt-4 text-sm font-medium text-brand-700 inline-flex items-center gap-1">
                  {lang === 'zh' ? '阅读指南' : lang === 'bm' ? 'Baca panduan' : 'Read guide'} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
