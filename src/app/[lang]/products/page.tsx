/**
 * /products — air conditioners catalogue (filter & search within aircon units).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { LOCALES, Locale, t } from '@/lib/i18n';
import { data, type ProductMedia } from '@/lib/data';
import { getAllSettings } from '@/lib/settings';
import { absoluteUrl, buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, itemListSchema, webPageSchema } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import ProductCard from '@/components/ProductCard';
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
        path: `/${lang}/products`,
        title: `${t(lang, 'products.pageTitle')} — ATORA`,
        description: t(lang, 'products.pageSub'),
    });
}
export default async function ProductsListPage({ params, searchParams, }: {
    params: Promise<{
        lang: string;
    }>;
    searchParams: Promise<{
        q?: string;
        brand?: string;
        category?: string;
    }>;
}) {
    let _searchParams = await searchParams;
    let _params = await params;
    const { lang: rawLang } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const sp = _searchParams;
    const s = await getAllSettings();
    const brands = await data.listActiveBrands();
    const categories = await data.listActiveCategories();
    const groups = await data.listCategoryGroups();
    const airconGroup = groups.find((g) => g.slug === 'air-conditioners');
    const airconCategories = airconGroup ? await data.listChildCategories(airconGroup.id) : [];
    const brand = sp.brand ? brands.find((b) => b.slug === sp.brand || String(b.id) === sp.brand) : undefined;
    const category = sp.category ? categories.find((c) => c.slug === sp.category || String(c.id) === sp.category) : undefined;
    const products = await data.searchProducts({
        q: sp.q,
        brandId: brand?.id,
        categoryId: category && airconCategories.some((c) => c.id === category.id) ? category.id : undefined,
        groupId: airconGroup?.id,
    });
    const mediaMap = new Map<number, ProductMedia[]>();
    for (const p of products) {
        mediaMap.set(p.id, await data.listProductMedia(p.id));
    }
    const pagePath = `/${lang}/products`;
    const breadcrumbNode = breadcrumbSchema(pagePath, [
        { name: t(lang, 'nav.home'), url: `/${lang}` },
        { name: t(lang, 'products.pageTitle'), url: pagePath },
    ]);
    const listNode = itemListSchema({
        path: pagePath,
        name: t(lang, 'products.pageTitle'),
        items: products.map((p) => ({
            name: p.name_en,
            url: `/${lang}/products/${p.slug}`,
            image: mediaMap.get(p.id)?.find((m) => m.type === 'image')?.url ?? null,
        })),
    });
    const pageNode = webPageSchema({
        lang,
        path: pagePath,
        title: `${t(lang, 'products.pageTitle')} — ATORA`,
        description: t(lang, 'products.pageSub'),
        breadcrumbId: `${absoluteUrl(pagePath)}#breadcrumb`,
    });
    return (<div className="container-fluid py-8">
      <JsonLd data={breadcrumbNode}/>
      <JsonLd data={listNode}/>
      <JsonLd data={pageNode}/>
      <header className="mb-8">
        <h1 className="heading-1 mb-2">{t(lang, 'products.pageTitle')}</h1>
        <p className="text-gray-600">{t(lang, 'products.pageSub')}</p>
        <p className="text-sm text-brand-700 mt-1">
          {t(lang, 'products.needParts')}{' '}
          <Link href={`/${lang}/parts`} className="underline font-medium">{t(lang, 'nav.parts')}</Link>
        </p>
      </header>

      {/* Filters */}
      <form className="card p-4 mb-6 grid sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <input type="text" name="q" defaultValue={sp.q} placeholder={t(lang, 'common.search')} className="input"/>
        </div>
        <select name="brand" defaultValue={sp.brand ?? ''} className="input">
          <option value="">{t(lang, 'products.filterByBrand')}</option>
          {brands.map((b) => (<option key={b.id} value={b.slug}>{b.name_en}</option>))}
        </select>
        <select name="category" defaultValue={sp.category ?? ''} className="input">
          <option value="">{t(lang, 'products.filterByCategory')}</option>
          {airconCategories.map((c) => (<option key={c.id} value={c.slug}>{c.name_en}</option>))}
        </select>
        <div className="sm:col-span-4 flex gap-2">
          <button type="submit" className="btn-primary">{t(lang, 'common.search')}</button>
          <Link href={`/${lang}/products`} className="btn-ghost">{t(lang, 'common.all')}</Link>
        </div>
      </form>

      <p className="text-sm text-gray-500 mb-4">{products.length} products</p>

      {products.length === 0 ? (<div className="card p-12 text-center text-gray-500">
          {t(lang, 'products.noResults')}
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (<ProductCard key={p.id} product={p} brand={brands.find((b) => b.id === p.brand_id)} media={mediaMap.get(p.id)} whatsappNumber={s.whatsapp_number} lang={lang}/>))}
        </div>)}
    </div>);
}
