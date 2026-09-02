/**
 * Locale-aware layout. Validates the [lang] param and renders
 * the public site chrome (header + footer + mobile bar).
 *
 * Emits the site-wide JSON-LD graph: Organization + WebSite + LocalBusiness
 * (one node per DB location), so every public page carries ATORA's entity data.
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { LOCALES, Locale } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomBar from '@/components/MobileBottomBar';
import HtmlLang from '@/components/HtmlLang';
import JsonLd from '@/components/JsonLd';
import { data } from '@/lib/data';
import { getAllSettings } from '@/lib/settings';
import { buildPageMetadata } from '@/lib/seo';
import { organizationSchema, websiteSchema, localBusinessSchema } from '@/lib/schema';
import { GEO } from '@/lib/positioning';

export async function generateMetadata({ params }: {
    params: Promise<{
        lang: string;
    }>;
}): Promise<Metadata> {
    let _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const s = await getAllSettings();
    return buildPageMetadata({
        lang,
        path: `/${lang}`,
        title: lang === 'zh' ? s.seo_default_title_zh : lang === 'bm' ? s.seo_default_title_bm : s.seo_default_title_en,
        description: lang === 'zh'
            ? s.seo_default_description_zh
            : lang === 'bm'
                ? s.seo_default_description_bm
                : s.seo_default_description_en,
    });
}
export default async function LangLayout({ children, params, }: {
    children: React.ReactNode;
    params: Promise<{
        lang: string;
    }>;
}) {
    let _params = await params;
    const { lang: rawLang } = _params;
    if (!(LOCALES as readonly string[]).includes(rawLang))
        notFound();
    const lang = rawLang as Locale;
    const brands = await data.listActiveBrands();
    const locations = await data.listActiveLocations();
    const categories = await data.listCategoryGroups();
    const s = await getAllSettings();

    // --- Site-wide structured data -----------------------------------------
    const org = organizationSchema(s, {
        locations,
        knowsAbout: categories.map((c) => c.name_en).filter(Boolean),
        serviceStates: [GEO.nationwide],
    });
    const website = websiteSchema(s);
    const localBusinesses = locations.map((loc) => localBusinessSchema(loc, s));

    return (<>
      <HtmlLang lang={lang}/>
      <JsonLd data={org}/>
      <JsonLd data={website}/>
      {localBusinesses.map((node, i) => (<JsonLd key={locations[i]?.slug ?? i} data={node}/>))}
      <Header lang={lang} whatsappNumber={s.whatsapp_number} companyNameEn={s.company_name_en} companyNameZh={s.company_name_zh}/>
      <main className="min-h-[60vh] pb-20 md:pb-0">{children}</main>
      <Footer lang={lang} brands={brands} locations={locations} company={{
            nameEn: s.company_name_en,
            nameZh: s.company_name_zh,
            registrationNo: s.registration_no,
            hqPhone: s.hq_phone,
            whatsappNumber: s.whatsapp_number,
            email: s.email,
            facebook: s.facebook,
            instagram: s.instagram,
            seoDefaultTitleEn: s.seo_default_title_en,
            openingHoursEn: s.opening_hours_en,
            footerAboutEn: lang === 'zh' ? s.footer_about_zh : lang === 'bm' ? s.footer_about_bm : s.footer_about_en,
            hqAddress: s.hq_address,
        }}/>
      <MobileBottomBar lang={lang} whatsappNumber={s.whatsapp_number} hqPhone={s.hq_phone}/>
    </>);
}
