/**
 * /brands — list of all brands supplied by ATORA.
 *
 * GEO note: ATORA is an independent multi-brand supplier; it is NOT an
 * authorised distributor of any single brand. Copy never claims otherwise.
 */
import type { Metadata } from 'next';
import { LOCALES, Locale, t } from '@/lib/i18n';
import { data } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, itemListSchema, webPageSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import BrandCard from '@/components/BrandCard';

export async function generateMetadata({ params }: {
    params: Promise<{
        lang: string;
    }>;
}): Promise<Metadata> {
    let _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    return buildPageMetadata({
        lang,
        path: `/${lang}/brands`,
        title: `${t(lang, 'brands.pageTitle')} — ATORA`,
        description: t(lang, 'brands.pageSub'),
    });
}

export default async function BrandsListPage({ params }: {
    params: Promise<{
        lang: string;
    }>;
}) {
    let _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const brands = await data.listActiveBrands();
    const jsonLd = [
        breadcrumbSchema(`/${lang}/brands`, [
            { name: t(lang, 'nav.home'), url: `/${lang}` },
            { name: t(lang, 'nav.brands'), url: `/${lang}/brands` },
        ]),
        itemListSchema({
            path: `/${lang}/brands`,
            name: `${t(lang, 'brands.pageTitle')} — ATORA`,
            items: brands.map((b) => ({
                name: b.name_en,
                url: `/${lang}/brands/${b.slug}`,
                image: b.logo || null,
            })),
        }),
        webPageSchema({ lang, path: `/${lang}/brands`, title: `${t(lang, 'brands.pageTitle')} — ATORA`, description: t(lang, 'brands.pageSub') }),
    ];
    return (<div className="container-fluid py-8">
      <JsonLd id="brands-page" data={jsonLd} />

      <header className="mb-8">
        <h1 className="heading-1 mb-2">{t(lang, 'brands.pageTitle')}</h1>
        <p className="text-gray-600">{t(lang, 'brands.pageSub')}</p>
      </header>

      {brands.length === 0 ? (<div className="card p-12 text-center text-gray-500">{t(lang, 'brands.noBrands')}</div>) : (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {brands.map((b) => (<BrandCard key={b.id} brand={b} lang={lang}/>))}
        </div>)}
    </div>);
}
