/**
 * /products — air conditioners catalogue (filter & search within aircon units).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { LOCALES, Locale, t, langAlternates } from '@/lib/i18n';
import { data } from '@/lib/data';
import { getAllSettings } from '@/lib/settings';
import ProductCard from '@/components/ProductCard';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  return {
    title: `${t(lang, 'products.pageTitle')} — ATORA`,
    description: t(lang, 'products.pageSub'),
    alternates: langAlternates(`/${lang}/products`),
  };
}

export default async function ProductsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string; brand?: string; category?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  const sp = await searchParams;
  const s = getAllSettings();

  const brands = data.listActiveBrands();
  const categories = data.listActiveCategories();
  const groups = data.listCategoryGroups();
  const airconGroup = groups.find((g) => g.slug === 'air-conditioners');
  const airconCategories = categories.filter((c) => airconGroup && c.parent_id === airconGroup.id);

  const brand = sp.brand ? brands.find((b) => b.slug === sp.brand || String(b.id) === sp.brand) : undefined;
  const category = sp.category ? categories.find((c) => c.slug === sp.category || String(c.id) === sp.category) : undefined;

  const products = data.searchProducts({
    q: sp.q,
    brandId: brand?.id,
    categoryId: category && airconCategories.some((c) => c.id === category.id) ? category.id : undefined,
    groupId: airconGroup?.id,
  });
  const mediaMap = new Map<number, ReturnType<typeof data.listProductMedia>>();
  for (const p of products) {
    mediaMap.set(p.id, data.listProductMedia(p.id));
  }

  return (
    <div className="container-fluid py-8">
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
          <input
            type="text"
            name="q"
            defaultValue={sp.q}
            placeholder={t(lang, 'common.search')}
            className="input"
          />
        </div>
        <select name="brand" defaultValue={sp.brand ?? ''} className="input">
          <option value="">{t(lang, 'products.filterByBrand')}</option>
          {brands.map((b) => (
            <option key={b.id} value={b.slug}>{b.name_en}</option>
          ))}
        </select>
        <select name="category" defaultValue={sp.category ?? ''} className="input">
          <option value="">{t(lang, 'products.filterByCategory')}</option>
          {airconCategories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name_en}</option>
          ))}
        </select>
        <div className="sm:col-span-4 flex gap-2">
          <button type="submit" className="btn-primary">{t(lang, 'common.search')}</button>
          <Link href={`/${lang}/products`} className="btn-ghost">{t(lang, 'common.all')}</Link>
        </div>
      </form>

      <p className="text-sm text-gray-500 mb-4">{products.length} products</p>

      {products.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          {t(lang, 'products.noResults')}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              brand={brands.find((b) => b.id === p.brand_id)}
              media={mediaMap.get(p.id)}
              whatsappNumber={s.whatsapp_number}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}
