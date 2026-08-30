/**
 * Homepage — the B2B landing page.
 * Sections, in order:
 *   1. Header (in layout)
 *   2. Hero
 *   3. Quick Photo/Video Enquiry
 *   4. Brands
 *   5. Product Categories
 *   6. Featured Products
 *   7. Aircond Parts
 *   8. Why Choose ATORA
 *   9. Project & Bulk Supply
 *  10. Technical Partners
 *  11. Product Videos
 *  12. Nationwide Malaysia Service
 *  13. Locations
 *  14. FAQ
 *  15. Contact CTA
 *  16. Footer (in layout)
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { LOCALES, Locale, t, langAlternates } from '@/lib/i18n';
import { data, type ProductMedia } from '@/lib/data';
import { pickLocalized } from '@/lib/i18n';
import { getAllSettings } from '@/lib/settings';
import QuickEnquiryForm from '@/components/QuickEnquiryForm';
import BrandCard from '@/components/BrandCard';
import ProductCard from '@/components/ProductCard';
import PartnerCard from '@/components/PartnerCard';
import LocationCard from '@/components/LocationCard';
export async function generateMetadata({ params }: {
    params: Promise<{
        lang: string;
    }>;
}): Promise<Metadata> {
    let _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const s = await getAllSettings();
    const title = lang === 'zh' ? s.seo_default_title_zh : lang === 'bm' ? s.seo_default_title_bm : s.seo_default_title_en;
    const description = lang === 'zh' ? s.seo_default_description_zh : lang === 'bm' ? s.seo_default_description_bm : s.seo_default_description_en;
    return {
        title,
        description,
        alternates: langAlternates(`/${lang}`),
        openGraph: { title, description, type: 'website' },
    };
}
export default async function HomePage({ params }: {
    params: Promise<{
        lang: string;
    }>;
}) {
    let _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const s = await getAllSettings();
    const brands = await data.listActiveBrands();
    const categories = await data.listActiveCategories();
    const featuredProducts = await data.listFeaturedProducts(8);
    const featuredPartners = await data.listFeaturedPartners(6);
    const locations = await data.listActiveLocations();
    const faqs = (await data.listActiveFaqs()).slice(0, 8);
    const allProducts = await data.listActiveProducts();
    // Build product media index for featured cards
    const mediaMap = new Map<number, ProductMedia[]>();
    for (const p of featuredProducts) {
        mediaMap.set(p.id, await data.listProductMedia(p.id));
    }
    // Group categories by parent for organised display
    const topCategories = categories.filter((c) => !c.parent_id);
    const childCategories = categories.filter((c) => c.parent_id);
    return (<>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.18),transparent_70%)]"/>
        <div className="container-fluid relative py-14 sm:py-20 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-5 ring-1 ring-white/20">
              {t(lang, 'home.heroEyebrow')}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
              {t(lang, 'home.heroTitle')}
            </h1>
            <p className="text-base sm:text-lg opacity-90 mb-8 max-w-2xl">{t(lang, 'home.heroSubtitle')}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={`/${lang}/contact`} className="btn bg-white text-brand-900 hover:bg-brand-50 px-5 py-2.5 text-sm font-semibold">{t(lang, 'home.heroCtaPrimary')}</Link>
              <a href={`https://wa.me/${s.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp px-5 py-2.5 text-sm font-semibold">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.264 8.264 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24zM8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.53.07-.26-.13-1.06-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.27-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01z"/></svg>
                {t(lang, 'home.heroCtaSecondary')}
              </a>
              <Link href={`/${lang}/products`} className="btn border border-white/40 text-white hover:bg-white/10 px-5 py-2.5 text-sm font-semibold">
                {t(lang, 'home.heroCtaTertiary')}
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[
                { k: String(brands.length), v: 'Brands' },
                { k: String(allProducts.length), v: lang === 'zh' ? '产品' : lang === 'bm' ? 'Produk' : 'Products' },
                { k: String(locations.length), v: lang === 'zh' ? '分店' : lang === 'bm' ? 'Cawangan' : 'Branches' },
              ].map((stat) => (
                <div key={stat.v} className="rounded-md bg-white/95 backdrop-blur p-3 text-center shadow-lg">
                  <div className="text-2xl font-bold text-brand-900">{stat.k}</div>
                  <div className="text-xs text-gray-600">{stat.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative aspect-square max-w-md mx-auto rounded-2xl bg-white/5 backdrop-blur-md ring-1 ring-white/15 overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <div className="text-7xl sm:text-8xl font-bold tracking-tighter mb-2 bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  ATORA
                </div>
                <div className="text-sm text-white/80 tracking-wide">Multi-Brand · Wholesale · Parts</div>
                <div className="mt-4 text-xs text-white/60">{s.registration_no}</div>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"/>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Photo/Video Enquiry */}
      <section className="section bg-gray-50/50">
        <div className="container-fluid">
          <QuickEnquiryForm lang={lang} whatsappNumber={s.whatsapp_number} brands={brands}/>
        </div>
      </section>

      {/* Brands */}
      {brands.length > 0 && (<section className="section">
          <div className="container-fluid">
            <div className="text-center mb-8">
              <h2 className="heading-2 mb-2">{t(lang, 'home.brandsTitle')}</h2>
              <p className="text-gray-600">{t(lang, 'home.brandsSub')}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {brands.map((b) => (<BrandCard key={b.id} brand={b} lang={lang}/>))}
            </div>
          </div>
        </section>)}

      {/* Product Categories */}
      {topCategories.length > 0 && (<section className="section bg-brand-50/30">
          <div className="container-fluid">
            <div className="text-center mb-8">
              <h2 className="heading-2 mb-2">{t(lang, 'home.categoriesTitle')}</h2>
              <p className="text-gray-600">{t(lang, 'home.categoriesSub')}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topCategories.map((cat) => (<Link key={cat.id} href={cat.slug === 'air-conditioners' ? `/${lang}/products` : `/${lang}/parts`} className="card p-6 hover:border-brand-300 hover:shadow-md transition">
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">{cat.name_en}</div>
                  <h3 className="font-bold text-brand-800 mb-2">{pickLocalized(cat as unknown as Record<string, unknown>, 'name', lang) || cat.name_en}</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {childCategories.filter((c) => c.parent_id === cat.id).slice(0, 4).map((sub) => (<li key={sub.id}>• {sub.name_en}</li>))}
                  </ul>
                </Link>))}
            </div>
          </div>
        </section>)}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (<section className="section">
          <div className="container-fluid">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="heading-2 mb-2">{t(lang, 'home.featuredTitle')}</h2>
                <p className="text-gray-600">{t(lang, 'home.featuredSub')}</p>
              </div>
              <Link href={`/${lang}/products`} className="hidden sm:inline-flex btn-secondary">{t(lang, 'common.viewAll')}</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.slice(0, 8).map((p) => (<ProductCard key={p.id} product={p} brand={brands.find((b) => b.id === p.brand_id)} media={mediaMap.get(p.id)} whatsappNumber={s.whatsapp_number} lang={lang}/>))}
            </div>
            <div className="text-center mt-6 sm:hidden">
              <Link href={`/${lang}/products`} className="btn-primary">{t(lang, 'common.viewAll')}</Link>
            </div>
          </div>
        </section>)}

      {/* Aircond Parts */}
      <section className="section bg-gray-50/50">
        <div className="container-fluid">
          <div className="text-center mb-10">
            <h2 className="heading-2 mb-2">{t(lang, 'home.partsTitle')}</h2>
            <p className="text-gray-600">{t(lang, 'home.partsSub')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {['compressor', 'pcb', 'fanMotor', 'capacitor', 'sensor', 'thermostat', 'relay', 'contactor', 'electrical', 'replacement'].map((key) => (<Link key={key} href={`/${lang}/parts`} className="card p-4 text-center hover:border-brand-300 transition">
                <div className="text-sm font-medium text-brand-700">{t(lang, `parts.categories.${key}`)}</div>
              </Link>))}
          </div>
        </div>
      </section>

      {/* Why Choose ATORA */}
      <section className="section">
        <div className="container-fluid">
          <div className="text-center mb-10">
            <h2 className="heading-2 mb-2">{t(lang, 'home.whyTitle')}</h2>
            <p className="text-gray-600">{t(lang, 'home.whySub')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (<div key={i} className="card p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-100 text-brand-700 font-bold text-lg mb-4">
                  {i}
                </div>
                <h3 className="font-semibold text-brand-800 mb-2 text-lg">{t(lang, `home.why${i}Title`)}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{t(lang, `home.why${i}Desc`)}</p>
              </div>))}
          </div>
        </div>
      </section>

      {/* Project & Bulk Supply */}
      <section className="section bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="container-fluid grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="heading-2 text-white mb-3">{t(lang, 'home.projectTitle')}</h2>
            <p className="opacity-90 mb-6">{t(lang, 'home.projectSub')}</p>
            <ul className="grid grid-cols-2 gap-2 mb-6">
              {['contractors', 'developers', 'businesses', 'offices', 'shops', 'restaurants', 'buildings', 'projects', 'bulk'].map((k) => (<li key={k} className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-brand-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {t(lang, `projectSupply.served.${k}`)}
                </li>))}
            </ul>
            <Link href={`/${lang}/project-supply`} className="btn bg-white text-brand-700 hover:bg-brand-50 px-5 py-2.5 font-semibold">
              {t(lang, 'home.projectCta')}
            </Link>
          </div>
          <div className="hidden lg:block">
            <div className="rounded-xl bg-white/10 backdrop-blur p-8 ring-1 ring-white/20">
              <div className="text-xs uppercase tracking-wider opacity-80 mb-3">{t(lang, 'projectSupply.whatWeOffer')}</div>
              <ul className="space-y-3">
                {['sourcing', 'brands', 'quotation', 'equipment', 'parts', 'materials', 'supply'].map((k) => (<li key={k} className="flex items-start gap-3 text-sm">
                    <svg className="w-5 h-5 text-brand-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    {t(lang, `projectSupply.offered.${k}`)}
                  </li>))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Partners */}
      {featuredPartners.length > 0 && (<section className="section">
          <div className="container-fluid">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="heading-2 mb-2">{t(lang, 'home.partnersTitle')}</h2>
                <p className="text-gray-600">{t(lang, 'home.partnersSub')}</p>
              </div>
              <Link href={`/${lang}/technical-partners`} className="hidden sm:inline-flex btn-secondary">{t(lang, 'common.viewAll')}</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredPartners.slice(0, 6).map((p) => (<PartnerCard key={p.id} partner={p} lang={lang}/>))}
            </div>
            <div className="text-center mt-6">
              <Link href={`/${lang}/technical-partners`} className="btn-primary">{t(lang, 'home.partnersCta')}</Link>
            </div>
          </div>
        </section>)}

      {/* Product Videos — placeholder dynamic section, admin uploads in homepage_content */}
      <ProductVideosSection lang={lang}/>

      {/* Nationwide Malaysia Service */}
      <section className="section bg-brand-50/40">
        <div className="container-fluid text-center">
          <div className="inline-flex items-center rounded-full bg-white px-4 py-1.5 ring-1 ring-brand-200 text-xs font-semibold text-brand-700 mb-4">
            <span className="h-2 w-2 rounded-full bg-brand-500 mr-2 animate-pulse"/>
            {t(lang, 'serviceNationwide')}
          </div>
          <h2 className="heading-2 mb-2 max-w-3xl mx-auto">{t(lang, 'home.nationwideTitle')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">{t(lang, 'home.nationwideSub')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 max-w-4xl mx-auto">
            {['Padang Serai', 'Sungai Petani', 'Kulim', 'Kedah', 'Northern Malaysia', 'All Malaysia'].map((loc) => (<div key={loc} className="card p-3 text-sm font-medium text-brand-700">{loc}</div>))}
          </div>
        </div>
      </section>

      {/* Locations */}
      {locations.length > 0 && (<section className="section">
          <div className="container-fluid">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="heading-2 mb-2">{t(lang, 'home.locationsTitle')}</h2>
                <p className="text-gray-600">{t(lang, 'home.locationsSub')}</p>
              </div>
              <Link href={`/${lang}/locations`} className="hidden sm:inline-flex btn-secondary">{t(lang, 'common.viewAll')}</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((loc) => (<LocationCard key={loc.id} location={loc} lang={lang}/>))}
            </div>
          </div>
        </section>)}

      {/* FAQ */}
      {faqs.length > 0 && (<section className="section bg-gray-50/50">
          <div className="container-fluid max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="heading-2 mb-2">{t(lang, 'home.faqTitle')}</h2>
              <p className="text-gray-600">{t(lang, 'home.faqSub')}</p>
            </div>
            <div className="space-y-3">
              {faqs.map((f) => {
                const q = pickLocalized(f as unknown as Record<string, unknown>, 'question', lang) || f.question_en;
                const a = pickLocalized(f as unknown as Record<string, unknown>, 'answer', lang) || f.answer_en;
                return (<details key={f.id} className="card p-4 group">
                    <summary className="font-medium text-brand-800 cursor-pointer flex items-center justify-between gap-3">
                      <span>{q}</span>
                      <svg className="w-4 h-4 transition group-open:rotate-180 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    </summary>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{a}</p>
                  </details>);
            })}
            </div>
            <div className="text-center mt-6">
              <Link href={`/${lang}/faq`} className="btn-secondary">{t(lang, 'common.viewAll')}</Link>
            </div>
          </div>
        </section>)}

      {/* Contact CTA */}
      <section className="section bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="container-fluid text-center max-w-3xl mx-auto">
          <h2 className="heading-2 text-white mb-3">{t(lang, 'home.contactCtaTitle')}</h2>
          <p className="opacity-90 mb-8">{t(lang, 'home.contactCtaSub')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={`/${lang}/contact`} className="btn bg-white text-brand-700 hover:bg-brand-50 px-6 py-3 font-semibold">
              {t(lang, 'common.getQuote')}
            </Link>
            <a href={`https://wa.me/${s.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp px-6 py-3 font-semibold">
              {t(lang, 'common.whatsappUs')}
            </a>
            <a href={`tel:${s.hq_phone.replace(/\s/g, '')}`} className="btn border border-white/40 text-white hover:bg-white/10 px-6 py-3 font-semibold">
              📞 {s.hq_phone}
            </a>
          </div>
        </div>
      </section>
    </>);
}
async function ProductVideosSection({ lang }: {
    lang: Locale;
}) {
    const sections = await data.listHomepageSections();
    const videoSection = sections.find((s) => s.section_key === 'product_videos');
    if (!videoSection || !videoSection.enabled)
        return null;
    return (<section className="section">
      <div className="container-fluid">
        <div className="text-center mb-8">
          <h2 className="heading-2 mb-2">
            {pickLocalized(videoSection as unknown as Record<string, unknown>, 'title', lang) ||
            videoSection.title_en ||
            t(lang, 'home.videosTitle')}
          </h2>
          <p className="text-gray-600">
            {pickLocalized(videoSection as unknown as Record<string, unknown>, 'subtitle', lang) ||
            videoSection.subtitle_en ||
            t(lang, 'home.videosSub')}
          </p>
        </div>
        {videoSection.video_url ? (<div className="aspect-video max-w-4xl mx-auto rounded-xl overflow-hidden shadow-md bg-gray-100">
            <video src={videoSection.video_url} controls className="w-full h-full object-cover"/>
          </div>) : (<div className="aspect-video max-w-4xl mx-auto rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500">
            Upload video via Admin → Homepage Content → Product Videos
          </div>)}
      </div>
    </section>);
}
