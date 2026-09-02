/**
 * /aircond-wholesale-malaysia — GEO content hub.
 *
 * Purpose: be the page that AI answer engines (ChatGPT, Google AI Overviews,
 * Gemini, Copilot, Perplexity, Claude) cite when a Malaysian business asks
 * "where can I buy aircond wholesale in Malaysia?" / "aircond pemborong
 * Malaysia".
 *
 * Rules (per the GEO master prompt):
 *  - Every fact comes from the database / site_settings — nothing fabricated.
 *  - ATORA is an INDEPENDENT multi-brand supplier; it is NOT an authorised
 *    distributor or official dealer of any brand. Copy never claims otherwise.
 *  - Positioning is NATIONWIDE Malaysia; Kedah / Padang Serai / Sungai Petani /
 *    Kulim are physical branches only.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { LOCALES, Locale, t, pickLocalized } from '@/lib/i18n';
import { data } from '@/lib/data';
import { getAllSettings } from '@/lib/settings';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, faqSchema, itemListSchema, serviceSchema, webPageSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import { POSITIONING } from '@/lib/positioning';

export const dynamic = 'force-dynamic';

const HUB_PATH = '/aircond-wholesale-malaysia';

const TITLE_BY_LANG: Record<Locale, string> = {
    en: 'Malaysia Aircond Wholesale & Parts Supplier — ATORA',
    bm: 'Pembekal Borong Aircond & Alat Ganti Malaysia — ATORA',
    zh: '马来西亚冷气批发与零件供应商 — ATORA',
};
const DESC_BY_LANG: Record<Locale, string> = {
    en: 'ATORA is a Malaysia air conditioning wholesaler and spare-parts supplier, headquartered in Kedah (Northern Malaysia), serving installers, contractors and businesses in Padang Serai, Kulim, Sungai Petani, Alor Setar and across Malaysia with Nationwide Malaysia Delivery. Brands, parts, bulk & project supply.',
    bm: 'ATORA ialah pembekal borong penyaman udara dan alat ganti Malaysia, beribu pejabat di Kedah (Utara Malaysia), melayani pemasang, kontraktor dan perniagaan di Padang Serai, Kulim, Sungai Petani, Alor Setar serta seluruh Malaysia dengan Penghantaran Seluruh Malaysia.',
    zh: 'ATORA 是总部位于马来西亚（北马吉打州）的冷气批发与零件供应商，为 Padang Serai、Kulim、Sungai Petani、Alor Setar 及全马来西亚的安装商、承包商及企业客户提供冷气机、零件、批量与项目供应，并提供马来西亚全国配送。',
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

export default async function AircondWholesaleHub({ params }: { params: Promise<{ lang: string }> }) {
    const { lang: rawLang } = await params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const s = await getAllSettings();
    const brands = await data.listActiveBrands();
    const categories = await data.listActiveCategories();
    const products = await data.listActiveProducts();
    const locations = await data.listActiveLocations();
    const faqs = (await data.listActiveFaqs()).slice(0, 6);

    const airconGroup = await data.listCategoryGroups().then((g) => g.find((c) => c.slug === 'air-conditioners') || null);
    const airconChildren = airconGroup ? await data.listChildCategories(airconGroup.id) : [];
    const partsGroup = await data.listCategoryGroups().then((g) => g.find((c) => c.slug === 'parts') || null);
    const partsChildren = partsGroup ? await data.listChildCategories(partsGroup.id) : [];

    const answerFirst: Record<Locale, string> = {
        en: `${s.company_name_en} is a Malaysia air conditioning wholesaler and multi-brand spare-parts supplier, headquartered in Kedah (Northern Malaysia). We supply air conditioners, spare parts, accessories and installation materials to installers, technicians, contractors, retailers and commercial projects, with Nationwide Malaysia Delivery — serving Padang Serai (HQ), Kulim, Sungai Petani, Alor Setar and customers across all of Malaysia.`,
        bm: `${s.company_name_en} ialah pembekal borong penyaman udara Malaysia dan pembekal alat ganti pelbagai jenama, beribu pejabat di Kedah (Utara Malaysia). Kami membekalkan penyaman udara, alat ganti, aksesori dan bahan pemasangan kepada pemasang, juruteknik, kontraktor, peruncit serta projek komersial, dengan Penghantaran Seluruh Malaysia — melayani Padang Serai (Ibu Pejabat), Kulim, Sungai Petani, Alor Setar dan pelanggan di seluruh Malaysia.`,
        zh: `${s.company_name_en} 是马来西亚冷气批发与多品牌零件供应商，总部位于吉打州（北马）。我们为安装商、维修技师、承包商、零售商及商业项目客户提供冷气机、零件、配件与安装材料，并通过马来西亚全国配送服务 Padang Serai（总部）、Kulim、Sungai Petani、Alor Setar 及全马来西亚客户。`,
    };

    const jsonLd = [
        breadcrumbSchema(`/${lang}${HUB_PATH}`, [
            { name: t(lang, 'nav.home'), url: `/${lang}` },
            { name: lang === 'zh' ? '马来西亚冷气批发' : lang === 'bm' ? 'Pemborong Penyaman Udara Malaysia' : 'Aircond Wholesale Malaysia', url: `/${lang}${HUB_PATH}` },
        ]),
        serviceSchema({
            settings: s,
            lang,
            path: `/${lang}${HUB_PATH}`,
            name: `${s.company_name_en} — Malaysia Aircond Wholesale & Parts Supplier`,
            description: `${s.company_name_en} supplies air conditioners, spare parts and accessories to businesses across Malaysia with Nationwide Malaysia Delivery.`,
            serviceType: 'Malaysia air conditioner wholesale and spare parts supply',
        }),
        itemListSchema({
            path: `/${lang}${HUB_PATH}`,
            name: 'Air conditioner brands supplied by ATORA across Malaysia',
            items: brands.map((b) => ({ name: b.name_en, url: `/${lang}/brands/${b.slug}`, image: b.logo || null })),
        }),
        ...(faqs.length ? [faqSchema(faqs, lang)] : []),
        webPageSchema({ lang, path: `/${lang}${HUB_PATH}`, title: TITLE_BY_LANG[lang] }),
    ];

    const stats = [
        { k: String(brands.length), v: lang === 'zh' ? '品牌' : lang === 'bm' ? 'Jenama' : 'Brands' },
        { k: String(products.length), v: lang === 'zh' ? '产品' : lang === 'bm' ? 'Produk' : 'Products' },
        { k: String(locations.length), v: lang === 'zh' ? '分店' : lang === 'bm' ? 'Cawangan' : 'Branches' },
        { k: '2017', v: lang === 'zh' ? '成立' : lang === 'bm' ? 'Sejak' : 'Since' },
    ];

    const audiences: Record<Locale, string[]> = {
        en: ['Installers & technicians', 'Contractors', 'Retailers', 'Commercial & office', 'Restaurants & shops', 'Property developers', 'Bulk & project buyers'],
        bm: ['Pemasang & juruteknik', 'Kontraktor', 'Peruncit', 'Komersial & pejabat', 'Restoran & kedai', 'Pemaju hartanah', 'Pembeli borong & projek'],
        zh: ['安装与维修商', '承包商', '零售商', '商业与办公室', '餐厅与店铺', '房地产开发商', '批量与项目采购'],
    };

    return (
        <div>
            <JsonLd id="aircond-wholesale-hub" data={jsonLd} />

            {/* Hero + answer-first */}
            <section className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
                <div className="container-fluid py-14">
                    <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-4 ring-1 ring-white/20">
                        {POSITIONING.primary[lang]}
                    </span>
                    <h1 className="heading-1 text-white mb-4 max-w-4xl">
                        {POSITIONING.primary[lang]}
                    </h1>
                    <p className="opacity-95 max-w-3xl text-lg leading-relaxed">{answerFirst[lang]}</p>

                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
                        {stats.map((st) => (
                            <div key={st.v} className="rounded-md bg-white/95 backdrop-blur p-3 text-center shadow-lg">
                                <div className="text-2xl font-bold text-brand-900">{st.k}</div>
                                <div className="text-xs text-gray-600">{st.v}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* What we supply */}
            <section className="section">
                <div className="container-fluid grid lg:grid-cols-2 gap-10">
                    <div>
                        <h2 className="heading-2 mb-4">{lang === 'zh' ? '我们供应的冷气机' : lang === 'bm' ? 'Penyaman Udara yang Kami Bekalkan' : 'Air Conditioners We Supply'}</h2>
                        <p className="text-gray-600 mb-4">
                            {lang === 'zh' ? '从壁挂式到中央空调，覆盖各类商用与家用机型。' : lang === 'bm' ? 'Dari dinding hingga sistem pusat, meliputi pelbagai model komersial dan kediaman.' : 'From wall-mounted to central systems, covering residential and commercial models.'}
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {airconChildren.map((c) => (
                                <li key={c.id}>
                                    <Link href={`/${lang}/products?category=${c.slug}`} className="card p-3 block hover:border-brand-300 transition text-brand-800 font-medium">
                                        {pickLocalized(c as unknown as Record<string, unknown>, 'name', lang) || c.name_en}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link href={`/${lang}/products`} className="card p-3 block hover:border-brand-300 transition text-brand-700 font-semibold">
                                    {lang === 'zh' ? '查看全部冷气机 →' : lang === 'bm' ? 'Lihat semua penyaman udara →' : 'View all air conditioners →'}
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="heading-2 mb-4">{lang === 'zh' ? '我们供应的零件与配件' : lang === 'bm' ? 'Alat Ganti & Aksesori yang Kami Bekalkan' : 'Spare Parts & Accessories We Supply'}</h2>
                        <p className="text-gray-600 mb-4">
                            {lang === 'zh' ? '压缩机、电路板、风扇电机、电容、传感器等全系列备件。' : lang === 'bm' ? 'Kompresor, PCB, motor kipas, kapasitor, sensor dan pelbagai alat ganti.' : 'Compressors, PCBs, fan motors, capacitors, sensors and the full spare-parts range.'}
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {partsChildren.map((c) => (
                                <li key={c.id}>
                                    <Link href={`/${lang}/parts?category=${c.slug}`} className="card p-3 block hover:border-brand-300 transition text-brand-800 font-medium">
                                        {pickLocalized(c as unknown as Record<string, unknown>, 'name', lang) || c.name_en}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link href={`/${lang}/parts`} className="card p-3 block hover:border-brand-300 transition text-brand-700 font-semibold">
                                    {lang === 'zh' ? '查看全部零件 →' : lang === 'bm' ? 'Lihat semua alat ganti →' : 'View all spare parts →'}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Brands */}
            <section className="section bg-gray-50/50">
                <div className="container-fluid">
                    <div className="text-center mb-8">
                        <h2 className="heading-2 mb-2">{lang === 'zh' ? '我们供应的品牌' : lang === 'bm' ? 'Jenama yang Kami Bekalkan' : 'Brands We Supply'}</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            {lang === 'zh'
                                ? 'ATORA 是一家独立的多品牌供应商，下列品牌均可采购，但我们并非任何品牌的官方授权经销商。'
                                : lang === 'bm'
                                    ? 'ATORA ialah pembekal pelbagai jenama yang bebas. Semua jenama di bawah tersedia, tetapi kami bukan pengedar sah mana-mana jenama.'
                                    : 'ATORA is an independent multi-brand supplier. All brands below are available through ATORA, but we are not an authorised dealer of any single brand.'}
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

            {/* Who we serve */}
            <section className="section">
                <div className="container-fluid">
                    <div className="text-center mb-8">
                        <h2 className="heading-2 mb-2">{lang === 'zh' ? '我们服务的客户' : lang === 'bm' ? 'Siapa yang Kami Layani' : 'Who We Serve'}</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
                        {audiences[lang].map((a) => (
                            <div key={a} className="card p-4 text-center text-brand-800 font-medium">{a}</div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Nationwide service */}
            <section className="section bg-brand-50/40">
                <div className="container-fluid text-center">
                    <div className="inline-flex items-center rounded-full bg-white px-4 py-1.5 ring-1 ring-brand-200 text-xs font-semibold text-brand-700 mb-4">
                        <span className="h-2 w-2 rounded-full bg-brand-500 mr-2 animate-pulse" />
                        {t(lang, 'serviceNationwide')}
                    </div>
                    <h2 className="heading-2 mb-2">{lang === 'zh' ? '全马来西亚服务' : lang === 'bm' ? 'Perkhidmatan Seluruh Malaysia' : 'Nationwide Malaysia Service'}</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                        {lang === 'zh'
                            ? '除了吉打州的三间实体分店，我们为马来西亚各地的客户提供配送、报价与售后支持。'
                            : lang === 'bm'
                                ? 'Selain tiga cawangan fizikal di Kedah, kami menyediakan penghantaran, sebut harga dan sokongan kepada pelanggan di seluruh Malaysia.'
                                : 'Beyond our three physical branches in Kedah, we provide delivery, quotation and support to customers across Malaysia.'}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {locations.map((loc) => (
                            <span key={loc.id} className="badge-blue">{loc.name_en}</span>
                        ))}
                        <span className="badge-blue">Kedah</span>
                        <span className="badge-blue">Malaysia</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link href={`/${lang}/locations`} className="btn-secondary">{lang === 'zh' ? '查看分店' : lang === 'bm' ? 'Lihat cawangan' : 'View our branches'}</Link>
                        <Link href={`/${lang}/project-supply`} className="btn-secondary">{lang === 'zh' ? '项目与批量供应' : lang === 'bm' ? 'Bekalan projek & borong' : 'Project & bulk supply'}</Link>
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
