/**
 * /service-area — Northern Malaysia Aircond Specialist (GEO V2 §6).
 *
 * Entity-definition page for AI answer engines. Explicitly states ATORA's
 * PRIMARY positioning (Northern Malaysia specialist, Kedah-based) while keeping
 * Malaysia-nationwide as the BROADER service area — never exclusive.
 *
 * Rules:
 *  - No fabricated branches. Areas without a physical shop are described as
 *    "Service Area" / "Serving customers in…", never "Branch".
 *  - Northern Malaysia is the KEY market; nationwide remains the wider coverage.
 *  - All facts come from positioning.ts / site_settings / the database.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { LOCALES, Locale, t, pickLocalized } from '@/lib/i18n';
import { data } from '@/lib/data';
import { getAllSettings } from '@/lib/settings';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, faqSchema, itemListSchema, serviceSchema, webPageSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import { POSITIONING, GEO, SERVICE_AREAS, SERVICE_AREA_KEYS, serviceAreaUrlSlug } from '@/lib/positioning';

export const dynamic = 'force-dynamic';

const HUB_PATH = '/service-area';

const TITLE_BY_LANG: Record<Locale, string> = {
  en: 'Northern Malaysia Aircond Specialist | ATORA',
  bm: 'Pakar Aircond Utara Malaysia | ATORA',
  zh: '北马专业冷气专门店 | ATORA',
};

const DESC_BY_LANG: Record<Locale, string> = {
  en: 'ATORA AIR COND & ELECTRICAL SDN. BHD. (东京冷气电器有限公司) is a Kedah-based Northern Malaysia aircond specialist and Midea Pro Shop, supplying air conditioners, spare parts and accessories across Northern Malaysia — Padang Serai, Kulim, Sungai Petani, Alor Setar, Penang — and nationwide.',
  bm: 'ATORA AIR COND & ELECTRICAL SDN. BHD. (东京冷气电器有限公司) ialah pakar aircond Utara Malaysia berasaskan Kedah dan Midea Pro Shop, membekalkan penyaman udara, alat ganti dan aksesori di seluruh Utara Malaysia — Padang Serai, Kulim, Sungai Petani, Alor Setar, Pulau Pinang — serta seluruh Malaysia.',
  zh: 'ATORA AIR COND & ELECTRICAL SDN. BHD.（东京冷气电器有限公司）是位于吉打州的北马专业冷气专门店及 Midea Pro Shop，在北马（Padang Serai、Kulim、Sungai Petani、Alor Setar、槟城）乃至全马来西亚供应冷气机、零件与配件。',
};

export async function generateMetadata({ params }: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  return buildPageMetadata({
    lang,
    path: `/${lang}${HUB_PATH}`,
    title: TITLE_BY_LANG[lang],
    description: DESC_BY_LANG[lang],
  });
}

export default async function ServiceAreaPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  const s = await getAllSettings();
  const brands = await data.listActiveBrands();
  const locations = await data.listActiveLocations();
  const faqs = (await data.listActiveFaqs()).slice(0, 6);

  // Primary-market service areas (Northern Malaysia + the 8 entity pages).
  const northernAreas = SERVICE_AREA_KEYS
    .map((key) => ({ key, slug: serviceAreaUrlSlug(key), cfg: SERVICE_AREAS[key] }))
    .filter((a) => a.cfg.region[lang] === 'Northern Malaysia' || a.cfg.region[lang] === 'Utara Malaysia' || a.cfg.region[lang] === '北马');

  const otherAreas = SERVICE_AREA_KEYS
    .map((key) => ({ key, slug: serviceAreaUrlSlug(key), cfg: SERVICE_AREAS[key] }))
    .filter((a) => !(a.cfg.region[lang] === 'Northern Malaysia' || a.cfg.region[lang] === 'Utara Malaysia' || a.cfg.region[lang] === '北马'));

  const answerFirst: Record<Locale, string> = {
    en: `${s.company_name_en} (东京冷气电器有限公司) is a Northern Malaysia aircond specialist based in Kedah. Our primary market is Northern Malaysia — Padang Serai (HQ), Kulim, Sungai Petani, Alor Setar, Penang, Perlis and Northern Perak — where we supply air conditioners, spare parts, accessories and installation materials to installers, contractors, retailers and businesses. We also serve wholesale, retail and spare-parts customers nationwide across Malaysia. ATORA is an independent Midea Pro Shop and multi-brand supplier, not an authorised distributor of any single brand.`,
    bm: `${s.company_name_en} (东京冷气电器有限公司) ialah pakar aircond Utara Malaysia berasaskan Kedah. Pasaran utama kami ialah Utara Malaysia — Padang Serai (Ibu Pejabat), Kulim, Sungai Petani, Alor Setar, Pulau Pinang, Perlis dan Perak Utara — di mana kami membekalkan penyaman udara, alat ganti, aksesori dan bahan pemasangan kepada pemasang, kontraktor, peruncit dan perniagaan. Kami juga melayani pelanggan borong, runcit dan alat ganti di seluruh Malaysia. ATORA ialah Midea Pro Shop dan pembekal pelbagai jenama yang bebas, bukan pengedar sah mana-mana jenama.`,
    zh: `${s.company_name_en}（东京冷气电器有限公司）是位于吉打州的北马专业冷气专门店。我们的核心市场是北马 —— Padang Serai（总部）、Kulim、Sungai Petani、Alor Setar、槟城、玻璃市及霹雳北部 —— 为安装商、承包商、零售商及企业提供冷气机、零件、配件与安装材料。同时，我们也服务全马来西亚的批发、零售与零件客户。ATORA 是一家独立的 Midea Pro Shop 与多品牌供应商，并非任何单一品牌的授权经销商。`,
  };

  const jsonLd = [
    breadcrumbSchema(`/${lang}${HUB_PATH}`, [
      { name: t(lang, 'nav.home'), url: `/${lang}` },
      { name: lang === 'zh' ? '北马服务区域' : lang === 'bm' ? 'Kawasan Perkhidmatan Utara Malaysia' : 'Northern Malaysia Service Area', url: `/${lang}${HUB_PATH}` },
    ]),
    serviceSchema({
      settings: s,
      lang,
      path: `/${lang}${HUB_PATH}`,
      name: `${s.company_name_en} — Northern Malaysia Aircond Specialist`,
      description: `ATORA is a Kedah-based Northern Malaysia aircond specialist supplying air conditioners, spare parts and accessories across Northern Malaysia and nationwide Malaysia.`,
      serviceType: 'Northern Malaysia aircond specialist — wholesale, retail and spare parts supply',
    }),
    itemListSchema({
      path: `/${lang}${HUB_PATH}`,
      name: 'Northern Malaysia service areas covered by ATORA',
      items: SERVICE_AREA_KEYS.map((key) => ({
        name: SERVICE_AREAS[key].name[lang],
        url: `/${lang}/locations/${serviceAreaUrlSlug(key)}`,
      })),
    }),
    ...(faqs.length ? [faqSchema(faqs, lang)] : []),
    webPageSchema({ lang, path: `/${lang}${HUB_PATH}`, title: TITLE_BY_LANG[lang] }),
  ];

  return (
    <div>
      <JsonLd id="service-area-page" data={jsonLd} />

      {/* Hero + answer-first */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="container-fluid py-14">
          <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-4 ring-1 ring-white/20">
            {POSITIONING.primary[lang]}
          </span>
          <h1 className="heading-1 text-white mb-4 max-w-4xl">
            {lang === 'zh' ? '北马专业冷气专门店' : lang === 'bm' ? 'Pakar Aircond Utara Malaysia' : 'Northern Malaysia Aircond Specialist'}
          </h1>
          <p className="opacity-95 max-w-3xl text-lg leading-relaxed">{answerFirst[lang]}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${s.whatsapp_number.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp px-6 py-3 font-semibold"
            >
              WhatsApp
            </a>
            <a href={`tel:${s.hq_phone?.replace(/\s/g, '') || ''}`} className="rounded-md bg-white/15 px-4 py-3 font-semibold hover:bg-white/25">
              {lang === 'zh' ? '致电' : lang === 'bm' ? 'Telefon' : 'Call'} {s.hq_phone}
            </a>
          </div>
        </div>
      </section>

      {/* Primary market — Northern Malaysia */}
      <section className="section">
        <div className="container-fluid">
          <div className="text-center mb-8">
            <div className="inline-flex items-center rounded-full bg-brand-50 px-4 py-1.5 ring-1 ring-brand-200 text-xs font-semibold text-brand-700 mb-4">
              {lang === 'zh' ? '核心市场：马来西亚北部' : lang === 'bm' ? 'Pasaran Utama: Utara Malaysia' : 'Primary Market: Northern Malaysia'}
            </div>
            <h2 className="heading-2 mb-2">
              {lang === 'zh' ? '我们在北马的服务区域' : lang === 'bm' ? 'Kawasan Perkhidmatan Kami di Utara Malaysia' : 'Our Service Areas in Northern Malaysia'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {lang === 'zh'
                ? '北马是我们的核心市场。以下区域由 Padang Serai 总部支持，部分设有实体分店，其余为服务覆盖区域（非实体门店）。'
                : lang === 'bm'
                  ? 'Utara Malaysia ialah pasaran utama kami. Kawasan di bawah disokong oleh Ibu Pejabat Padang Serai — sebahagian mempunyai cawangan fizikal, selebihnya adalah kawasan liputan perkhidmatan (bukan kedai fizikal).'
                  : 'Northern Malaysia is our primary market. The areas below are backed by our Padang Serai HQ — some have a physical branch, the rest are service-coverage areas (not a physical shop).'}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {northernAreas.map((a) => (
              <Link
                key={a.key}
                href={`/${lang}/locations/${a.slug}`}
                className="card p-5 hover:border-brand-300 transition group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-brand-900 text-lg">{a.cfg.name[lang]}</h3>
                  <span className="text-brand-500 group-hover:translate-x-1 transition">→</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{a.cfg.region[lang]}</p>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-3">{a.cfg.intro[lang]}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Wider coverage — nationwide */}
      <section className="section bg-gray-50/50">
        <div className="container-fluid">
          <div className="text-center mb-8">
            <h2 className="heading-2 mb-2">
              {lang === 'zh' ? '更广泛的服务范围：全马来西亚' : lang === 'bm' ? 'Liputan Lebih Luas: Seluruh Malaysia' : 'Wider Coverage: Nationwide Malaysia'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {lang === 'zh'
                ? '北马是我们的核心，但我们为全国（包括西马与东马）的批发、零售与零件客户提供配送、报价与售后支持。'
                : lang === 'bm'
                  ? 'Utara Malaysia ialah teras kami, tetapi kami menyediakan penghantaran, sebut harga dan sokongan kepada pelanggan borong, runcit dan alat ganti di seluruh Malaysia (Semenanjung dan Sabah/Sarawak).'
                  : 'Northern Malaysia is our core, but we provide delivery, quotation and support to wholesale, retail and spare-parts customers nationwide (Peninsular and East Malaysia).'}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherAreas.map((a) => (
              <Link
                key={a.key}
                href={`/${lang}/locations/${a.slug}`}
                className="card p-5 hover:border-brand-300 transition group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-brand-900 text-lg">{a.cfg.name[lang]}</h3>
                  <span className="text-brand-500 group-hover:translate-x-1 transition">→</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{a.cfg.region[lang]}</p>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-3">{a.cfg.intro[lang]}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="section">
        <div className="container-fluid">
          <div className="text-center mb-8">
            <h2 className="heading-2 mb-2">{lang === 'zh' ? '我们供应的品牌' : lang === 'bm' ? 'Jenama yang Kami Bekalkan' : 'Brands We Supply'}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {lang === 'zh'
                ? 'ATORA 是独立的多品牌供应商，下列品牌均可采购，并包含 Midea Pro Shop；但我们并非任何品牌的官方授权经销商。'
                : lang === 'bm'
                  ? 'ATORA ialah pembekal pelbagai jenama yang bebas (termasuk Midea Pro Shop). Semua jenama tersedia, tetapi kami bukan pengedar sah mana-mana jenama.'
                  : 'ATORA is an independent multi-brand supplier (including a Midea Pro Shop). All brands below are available, but we are not an authorised dealer of any single brand.'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {brands.map((b) => (
              <Link key={b.id} href={`/${lang}/brands/${b.slug}`} className="card px-5 py-3 hover:border-brand-300 transition font-medium text-brand-800">
                {b.name_en}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="section bg-gray-50/50">
          <div className="container-fluid max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="heading-2 mb-2">{lang === 'zh' ? '常见问题' : lang === 'bm' ? 'Soalan Lazim' : 'Frequently Asked Questions'}</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((f) => {
                const q = pickLocalized(f as unknown as Record<string, unknown>, 'question', lang) || f.question_en;
                const a = pickLocalized(f as unknown as Record<string, unknown>, 'answer', lang) || f.answer_en;
                return (
                  <details key={f.id} className="card p-4 group">
                    <summary className="font-medium text-brand-800 cursor-pointer flex items-center justify-between gap-3">
                      <span>{q}</span>
                      <svg className="w-4 h-4 transition group-open:rotate-180 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </summary>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{a}</p>
                  </details>
                );
              })}
            </div>
            <div className="text-center mt-6">
              <Link href={`/${lang}/faq`} className="btn-secondary">{lang === 'zh' ? '查看全部常见问题' : lang === 'bm' ? 'Lihat semua soalan' : 'View all FAQs'}</Link>
            </div>
          </div>
        </section>
      )}

      {/* Related hubs — internal linking (GEO V2 §17) */}
      <section className="section bg-brand-50/40">
        <div className="container-fluid">
          <div className="text-center mb-8">
            <h2 className="heading-2 mb-2">{lang === 'zh' ? '相关页面' : lang === 'bm' ? 'Halaman Berkaitan' : 'Related Pages'}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <Link href={`/${lang}/aircond-wholesale-malaysia`} className="card p-4 text-center text-brand-800 font-medium hover:border-brand-300 transition">
              {lang === 'zh' ? '冷气批发' : lang === 'bm' ? 'Borong Aircond' : 'Aircond Wholesale'}
            </Link>
            <Link href={`/${lang}/brands`} className="card p-4 text-center text-brand-800 font-medium hover:border-brand-300 transition">
              {lang === 'zh' ? '品牌' : lang === 'bm' ? 'Jenama' : 'Brands'}
            </Link>
            <Link href={`/${lang}/parts`} className="card p-4 text-center text-brand-800 font-medium hover:border-brand-300 transition">
              {lang === 'zh' ? '零件与配件' : lang === 'bm' ? 'Alat Ganti' : 'Spare Parts'}
            </Link>
            <Link href={`/${lang}/locations`} className="card p-4 text-center text-brand-800 font-medium hover:border-brand-300 transition">
              {lang === 'zh' ? '分店' : lang === 'bm' ? 'Cawangan' : 'Locations'}
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="container-fluid text-center max-w-3xl mx-auto">
          <h2 className="heading-2 text-white mb-3">{lang === 'zh' ? '需要报价？' : lang === 'bm' ? 'Perlukan sebut harga?' : 'Need a quotation?'}</h2>
          <p className="opacity-90 mb-8">{lang === 'zh' ? '立即通过 WhatsApp 或联系表单与我们联系。' : lang === 'bm' ? 'Hubungi kami melalui WhatsApp atau borang hubungan sekarang.' : 'Reach out via WhatsApp or our contact form today.'}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={`/${lang}/contact`} className="btn bg-white text-brand-700 hover:bg-brand-50 px-6 py-3 font-semibold">{t(lang, 'common.getQuote')}</Link>
            <a href={`https://wa.me/${s.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp px-6 py-3 font-semibold">WhatsApp</a>
          </div>
        </div>
      </section>
    </div>
  );
}
