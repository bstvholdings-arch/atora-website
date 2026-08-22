/**
 * /parts — spare parts & accessories catalogue (all non-aircon products).
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
    title: `${t(lang, 'parts.pageTitle')} — ATORA`,
    description: t(lang, 'parts.pageSub'),
    alternates: langAlternates(`/${lang}/parts`),
  };
}

export default async function PartsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  const sp = await searchParams;
  const s = getAllSettings();

  const brands = data.listActiveBrands();
  const categories = data.listActiveCategories();
  const groups = data.listCategoryGroups();
  const airconGroup = groups.find((g) => g.slug === 'air-conditioners');
  const partsGroups = groups.filter((g) => g.id !== airconGroup?.id);
  const partsGroupIds = partsGroups.map((g) => g.id);
  const partsCategories = categories.filter((c) => partsGroupIds.includes(c.parent_id ?? -1));

  const category = sp.category
    ? categories.find((c) => c.slug === sp.category || String(c.id) === sp.category)
    : undefined;

  const products = data.searchProducts({
    q: sp.q,
    categoryId: category && partsGroupIds.includes(category.parent_id ?? -1) ? category.id : undefined,
    groupIds: partsGroupIds,
  });
  const mediaMap = new Map<number, ReturnType<typeof data.listProductMedia>>();
  for (const p of products) {
    mediaMap.set(p.id, data.listProductMedia(p.id));
  }

  return (
    <div className="container-fluid py-8">
      <header className="mb-8">
        <h1 className="heading-1 mb-2">{t(lang, 'parts.pageTitle')}</h1>
        <p className="text-gray-600">{t(lang, 'parts.pageSub')}</p>
        <p className="text-sm text-brand-700 mt-1">
          {t(lang, 'parts.needAircon')}{' '}
          <Link href={`/${lang}/products`} className="underline font-medium">{t(lang, 'nav.products')}</Link>
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
        <select name="category" defaultValue={sp.category ?? ''} className="input">
          <option value="">{t(lang, 'products.filterByCategory')}</option>
          {partsCategories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name_en}</option>
          ))}
        </select>
        <div className="sm:col-span-4 flex gap-2">
          <button type="submit" className="btn-primary">{t(lang, 'common.search')}</button>
          <Link href={`/${lang}/parts`} className="btn-ghost">{t(lang, 'common.all')}</Link>
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

      <div className="rounded-lg bg-brand-50 p-6 text-center mt-10">
        <p className="text-sm text-brand-800 mb-3">
          {lang === 'zh'
            ? '找不到您要的零件？上传图片让我们帮您识别。'
            : lang === 'bm'
              ? 'Tidak menemui alat ganti yang anda cari? Muat naik foto dan kami akan kenal pasti.'
              : "Can't find what you need? Upload a photo and we'll identify it."}
        </p>
        <Link href={`/${lang}#quick-enquiry`} className="btn-primary">{t(lang, 'common.whatsappUs')}</Link>
      </div>
    </div>
  );
}
