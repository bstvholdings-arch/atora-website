/**
 * /[lang]/locations/[slug] — location & service-area entity pages (GEO V2 §6).
 *
 * Two kinds of slug are handled:
 *  - Real physical branches (Padang Serai HQ, Kulim, Sungai Petani) → DB-backed,
 *    rendered as LocalBusiness with address / phone / maps / hours.
 *  - Service areas (Alor Setar, Kedah, Penang, Northern Malaysia, Malaysia) →
 *    described as "serving customers in…", NEVER as a fake physical branch.
 *
 * No fabricated data: every fact comes from the DB location row or the curated
 * SERVICE_AREAS copy in src/lib/positioning.ts.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LOCALES, Locale, t, pickLocalized } from '@/lib/i18n';
import { data } from '@/lib/data';
import { getAllSettings } from '@/lib/settings';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, localBusinessSchema, serviceSchema, webPageSchema, itemListSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import { POSITIONING, SERVICE_AREAS, resolveServiceArea, serviceAreaUrlSlug } from '@/lib/positioning';

// Real-branch page slugs → DB location slug
const BRANCH_MAP: Record<string, string> = {
  'padang-serai': 'padang-serai-hq',
  kulim: 'kulim',
  'sungai-petani': 'sungai-petani',
};

export function generateStaticParams() {
  const slugs = [
    ...Object.keys(BRANCH_MAP),
    ...Object.keys(SERVICE_AREAS).map((k) => serviceAreaUrlSlug(k as keyof typeof SERVICE_AREAS)),
  ];
  return LOCALES.flatMap((l) => slugs.map((slug) => ({ lang: l, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  const sa = resolveServiceArea(slug);
  const name = sa ? SERVICE_AREAS[sa].name[lang] : slug;
  const title = `${name} Aircond — ATORA ${POSITIONING.primary[lang]}`;
  const description = sa ? SERVICE_AREAS[sa].intro[lang] : '';
  return buildPageMetadata({ lang, path: `/${lang}/locations/${slug}`, title, description });
}

export default async function LocationPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  const s = await getAllSettings();
  const sa = resolveServiceArea(slug);
  if (!sa) notFound();

  const cfg = SERVICE_AREAS[sa];
  const dbSlug = BRANCH_MAP[slug];
  const locations = await data.listActiveLocations();
  const branch = dbSlug ? locations.find((l) => l.slug === dbSlug) : undefined;
  const isBranch = !!branch;

  const brands = await data.listActiveBrands();
  const categories = await data.listActiveCategories();
  const waLink = s.whatsapp_number ? `https://wa.me/${s.whatsapp_number.replace(/[^0-9]/g, '')}` : null;

  const jsonLd: unknown[] = [
    breadcrumbSchema(`/${lang}/locations/${slug}`, [
      { name: t(lang, 'nav.home'), url: `/${lang}` },
      { name: t(lang, 'nav.locations'), url: `/${lang}/locations` },
      { name: cfg.name[lang], url: `/${lang}/locations/${slug}` },
    ]),
    serviceSchema({
      settings: s,
      lang,
      path: `/${lang}/locations/${slug}`,
      name: `${cfg.name[lang]} — ${s.company_name_en}`,
      description: cfg.intro[lang],
      serviceType: 'Air conditioner wholesale, retail and spare parts supply',
    }),
    ...(branch ? [localBusinessSchema(branch, s)] : []),
    itemListSchema({
      path: `/${lang}/locations/${slug}`,
      name: `Air conditioning brands available from ATORA in ${cfg.name[lang]}`,
      items: brands.map((b) => ({ name: b.name_en, url: `/${lang}/brands/${b.slug}` })),
    }),
    webPageSchema({ lang, path: `/${lang}/locations/${slug}`, title: `${cfg.name[lang]} Aircond — ATORA` }),
  ];

  const nearby = cfg.nearby.filter((n) => n !== sa).map((n) => ({ slug: serviceAreaUrlSlug(n), name: SERVICE_AREAS[n].name[lang] }));

  return (
    <div>
      <JsonLd id={`location-${slug}`} data={jsonLd} />
      <section className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="container-fluid py-12">
          <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-3 ring-1 ring-white/20">
            {POSITIONING.primary[lang]}
          </span>
          <h1 className="heading-1 text-white mb-3">{cfg.name[lang]} Aircond{isBranch ? '' : ' — Service Area'}</h1>
          <p className="opacity-95 max-w-3xl text-lg leading-relaxed">{cfg.intro[lang]}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener" className="rounded-md bg-green-500 px-4 py-2 font-semibold text-white hover:bg-green-600">
                {lang === 'zh' ? 'WhatsApp 咨询' : lang === 'bm' ? 'Hubungi WhatsApp' : 'WhatsApp Enquiry'}
              </a>
            )}
            <a href={`tel:${s.hq_phone?.replace(/\s/g, '') || ''}`} className="rounded-md bg-white/15 px-4 py-2 font-semibold hover:bg-white/25">
              {lang === 'zh' ? '致电' : lang === 'bm' ? 'Telefon' : 'Call'} {s.hq_phone}
            </a>
            {branch?.google_maps_url && (
              <a href={branch.google_maps_url} target="_blank" rel="noopener" className="rounded-md bg-white/15 px-4 py-2 font-semibold hover:bg-white/25">
                {lang === 'zh' ? '在 Google Maps 查看 ATORA' : lang === 'bm' ? 'Lihat ATORA di Google Maps' : 'Find ATORA on Google Maps'}
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="container-fluid py-10 space-y-10">
        {/* Branch facts (only when a real branch exists) */}
        {branch && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-gray-500">{lang === 'zh' ? '地址' : lang === 'bm' ? 'Alamat' : 'Address'}</div>
              <div className="font-medium">{branch.address || s.hq_address}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-gray-500">{lang === 'zh' ? '营业时间' : lang === 'bm' ? 'Waktu Operasi' : 'Opening Hours'}</div>
              <div className="font-medium">{branch.opening_hours || s.opening_hours_en}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-gray-500">{lang === 'zh' ? '电话' : lang === 'bm' ? 'Telefon' : 'Phone'}</div>
              <div className="font-medium">{branch.telephone || s.hq_phone}</div>
            </div>
          </section>
        )}

        {/* Services + products */}
        <section>
          <h2 className="heading-2 mb-3">{lang === 'zh' ? 'ATORA 提供的服务' : lang === 'bm' ? 'Perkhidmatan ATORA' : 'What ATORA Provides'}</h2>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>{lang === 'zh' ? '冷气机批发与零售' : lang === 'bm' ? 'Borong & runcit penyaman udara' : 'Air conditioner wholesale & retail'}</li>
            <li>{lang === 'zh' ? '冷气零件与配件' : lang === 'bm' ? 'Alat ganti & aksesori aircond' : 'Aircond spare parts & accessories'}</li>
            <li>{lang === 'zh' ? '安装材料' : lang === 'bm' ? 'Bahan pemasangan' : 'Installation materials'}</li>
            <li>{lang === 'zh' ? '项目与批量供应' : lang === 'bm' ? 'Bekalan projek & borong' : 'Project & bulk supply'}</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.slice(0, 10).map((c) => (
              <Link key={c.id} href={`/${lang}/products?category=${c.slug}`} className="rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200">
                {pickLocalized(c, 'name', lang) || c.name_en}
              </Link>
            ))}
          </div>
        </section>

        {/* Brands */}
        <section>
          <h2 className="heading-2 mb-3">{lang === 'zh' ? '供应的品牌' : lang === 'bm' ? 'Jenama yang dibekalkan' : 'Brands Available'}</h2>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <Link key={b.id} href={`/${lang}/brands/${b.slug}`} className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">
                {b.name_en}
              </Link>
            ))}
          </div>
        </section>

        {/* Nearby service areas — internal linking (GEO V2 §17) */}
        <section>
          <h2 className="heading-2 mb-3">{lang === 'zh' ? '附近服务区域' : lang === 'bm' ? 'Kawasan Perkhidmatan Berdekatan' : 'Nearby Service Areas'}</h2>
          <div className="flex flex-wrap gap-2">
            {nearby.map((n) => (
              <Link key={n.slug} href={`/${lang}/locations/${n.slug}`} className="rounded-md bg-brand-50 px-3 py-1 text-sm text-brand-800 hover:bg-brand-100">
                {n.name} →
              </Link>
            ))}
            <Link href={`/${lang}/service-area`} className="rounded-md bg-brand-50 px-3 py-1 text-sm text-brand-800 hover:bg-brand-100">
              {lang === 'zh' ? '北马服务范围' : lang === 'bm' ? 'Liputan Utara Malaysia' : 'Northern Malaysia Service Area'} →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
