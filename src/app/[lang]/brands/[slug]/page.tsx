/**
 * /brands/[slug] — brand detail page with its products.
 *
 * GEO note: ATORA is an INDEPENDENT multi-brand supplier. We never claim to be
 * an "official distributor" or "authorised dealer" of any brand.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LOCALES, Locale, t, pickLocalized } from '@/lib/i18n';
import { data, type ProductMedia } from '@/lib/data';
import { getAllSettings } from '@/lib/settings';
import { absoluteUrl, buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, brandSchema, itemListSchema, webPageSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import ProductCard from '@/components/ProductCard';

export async function generateMetadata({ params, }: {
    params: Promise<{
        lang: string;
        slug: string;
    }>;
}) {
    let _params = await params;
    const { lang: rawLang, slug } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const brand = await data.getBrandBySlug(slug);
    if (!brand)
        return { title: 'Brand — ATORA', robots: { index: false, follow: false } };
    const name = pickLocalized(brand as unknown as Record<string, unknown>, 'name', lang) || brand.name_en;
    const desc =
        pickLocalized(brand as unknown as Record<string, unknown>, 'description', lang) ||
        brand.description_en ||
        `${name} air conditioners and spare parts are supplied by ATORA across Malaysia. ATORA is an independent multi-brand supplier and is not an authorised distributor of ${name}.`;
    return buildPageMetadata({
        lang,
        path: `/${lang}/brands/${brand.slug}`,
        title: `${name} Aircond Supplier Malaysia — ATORA`,
        description: desc,
        images: brand.logo ? [brand.logo] : undefined,
    });
}

export default async function BrandDetailPage({ params, }: {
    params: Promise<{
        lang: string;
        slug: string;
    }>;
}) {
    let _params = await params;
    const { lang: rawLang, slug } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const brand = await data.getBrandBySlug(slug);
    if (!brand)
        notFound();
    const s = await getAllSettings();
    const products = await data.listBrandProducts(brand.id);
    const mediaMap = new Map<number, ProductMedia[]>();
    for (const p of products) {
        mediaMap.set(p.id, await data.listProductMedia(p.id));
    }
    const name = pickLocalized(brand as unknown as Record<string, unknown>, 'name', lang) || brand.name_en;
    const desc = pickLocalized(brand as unknown as Record<string, unknown>, 'description', lang) || brand.description_en;
    const path = `/${lang}/brands/${brand.slug}`;

    const jsonLd = [
        breadcrumbSchema(`/${lang}/brands`, [
            { name: t(lang, 'nav.home'), url: `/${lang}` },
            { name: t(lang, 'nav.brands'), url: `/${lang}/brands` },
            { name, url: path },
        ]),
        brandSchema({ brand, lang, path, productCount: products.length }),
        itemListSchema({
            path,
            name: `${name} products supplied by ATORA`,
            items: products.map((p) => ({
                name: pickLocalized(p as unknown as Record<string, unknown>, 'name', lang) || p.name_en,
                url: `/${lang}/products/${p.slug}`,
            })),
        }),
        webPageSchema({ lang, path, title: `${name} Aircond Supplier Malaysia — ATORA`, description: desc || undefined }),
    ];

    return (<div className="container-fluid py-8">
      <JsonLd id="brand-page" data={jsonLd} />

      <nav className="text-sm text-gray-500 mb-4">
        <a href={`/${lang}`} className="hover:text-brand-700">{t(lang, 'nav.home')}</a>
        <span className="mx-2">/</span>
        <a href={`/${lang}/brands`} className="hover:text-brand-700">{t(lang, 'nav.brands')}</a>
        <span className="mx-2">/</span>
        <span className="text-brand-700">{name}</span>
      </nav>

      <header className="card p-6 sm:p-8 mb-8 flex flex-col sm:flex-row gap-6 items-center">
        {brand.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logo} alt={name} className="h-20 w-auto"/>) : (<div className="h-20 w-20 rounded-md bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-3xl">
            {name.charAt(0)}
          </div>)}
        <div>
          <h1 className="heading-1 mb-2">{name}</h1>
          {desc && <p className="text-gray-600 max-w-3xl">{desc}</p>}
          <p className="text-sm text-gray-500 mt-3">
            {products.length} products · Supplied by ATORA across Malaysia
          </p>
        </div>
      </header>

      {products.length === 0 ? (<div className="card p-12 text-center text-gray-500">{t(lang, 'products.noResults')}</div>) : (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (<ProductCard key={p.id} product={p} brand={brand} media={mediaMap.get(p.id)} whatsappNumber={s.whatsapp_number} lang={lang}/>))}
        </div>)}
    </div>);
}
