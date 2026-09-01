/**
 * /aircond-guide/[slug] — a single editorial guide (GEO V2 §7).
 *
 * Renders one guide from src/lib/guides.ts. Pure content + internal links;
 * no fabricated data. Cross-links strengthen the site's GEO internal linking.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LOCALES, Locale, t } from '@/lib/i18n';
import { getAllSettings } from '@/lib/settings';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, webPageSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import { GUIDES, getGuide } from '@/lib/guides';

export const dynamic = 'force-dynamic';

const HUB_PATH = '/aircond-guide';

export function generateStaticParams() {
  return LOCALES.flatMap((l) => GUIDES.map((g) => ({ lang: l, slug: g.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  const g = getGuide(slug);
  if (!g) return buildPageMetadata({ lang, path: `/${lang}${HUB_PATH}/${slug}`, title: 'Guide', description: '' });
  return buildPageMetadata({ lang, path: `/${lang}${HUB_PATH}/${slug}`, title: `${g.title[lang]} — ATORA`, description: g.excerpt[lang] });
}

export default async function GuideArticle({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  const s = await getAllSettings();
  const g = getGuide(slug);
  if (!g) notFound();

  const jsonLd = [
    breadcrumbSchema(`/${lang}${HUB_PATH}/${slug}`, [
      { name: t(lang, 'nav.home'), url: `/${lang}` },
      { name: lang === 'zh' ? '冷气指南' : lang === 'bm' ? 'Panduan Aircond' : 'Aircond Guides', url: `/${lang}${HUB_PATH}` },
      { name: g.title[lang], url: `/${lang}${HUB_PATH}/${slug}` },
    ]),
    webPageSchema({ lang, path: `/${lang}${HUB_PATH}/${slug}`, title: `${g.title[lang]} — ATORA`, description: g.excerpt[lang] }),
  ];

  return (
    <div>
      <JsonLd id={`guide-${slug}`} data={jsonLd} />

      <section className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="container-fluid py-12">
          <Link href={`/${lang}${HUB_PATH}`} className="text-sm text-white/80 hover:text-white inline-flex items-center gap-1 mb-3">
            ← {lang === 'zh' ? '全部指南' : lang === 'bm' ? 'Semua panduan' : 'All guides'}
          </Link>
          <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-3 ring-1 ring-white/20">
            {lang === 'zh' ? '北马专业冷气专门店' : lang === 'bm' ? 'Pakar Aircond Utara Malaysia' : 'Northern Malaysia Aircond Specialist'}
          </span>
          <h1 className="heading-1 text-white mb-3 max-w-4xl">{g.title[lang]}</h1>
          <p className="opacity-95 max-w-3xl text-lg leading-relaxed">{g.excerpt[lang]}</p>
        </div>
      </section>

      <article className="section">
        <div className="container-fluid max-w-3xl space-y-8">
          {g.sections.map((sec, i) => (
            <section key={i}>
              <h2 className="heading-2 mb-3 text-brand-900">{sec.heading[lang]}</h2>
              <p className="text-gray-700 leading-relaxed">{sec.body[lang]}</p>
            </section>
          ))}

          {/* Internal links — GEO V2 §17 */}
          {g.relatedLinks.length > 0 && (
            <section className="rounded-lg border border-brand-200 bg-brand-50/50 p-5">
              <h2 className="heading-3 mb-3 text-brand-900">
                {lang === 'zh' ? '相关页面' : lang === 'bm' ? 'Halaman Berkaitan' : 'Related Pages'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {g.relatedLinks.map((link, i) => (
                  <Link key={i} href={link.href(lang)} className="rounded-md bg-white px-3 py-1.5 text-sm text-brand-800 ring-1 ring-brand-200 hover:bg-brand-100">
                    {link.label[lang]} →
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="rounded-lg bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-center text-white">
            <h2 className="heading-3 text-white mb-2">{lang === 'zh' ? '需要报价？' : lang === 'bm' ? 'Perlukan sebut harga?' : 'Need a quotation?'}</h2>
            <div className="flex flex-wrap justify-center gap-3 mt-3">
              <Link href={`/${lang}/contact`} className="btn bg-white text-brand-700 hover:bg-brand-50 px-6 py-3 font-semibold">{t(lang, 'common.getQuote')}</Link>
              <a href={`https://wa.me/${s.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp px-6 py-3 font-semibold">WhatsApp</a>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
