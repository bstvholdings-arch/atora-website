/**
 * /brands/[slug] — brand detail page with its products.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LOCALES, Locale, t, langAlternates } from '@/lib/i18n';
import { data, type ProductMedia } from '@/lib/data';
import { pickLocalized } from '@/lib/i18n';
import { getAllSettings } from '@/lib/settings';
import ProductCard from '@/components/ProductCard';
export async function generateMetadata({ params, }: {
    params: Promise<{
        lang: string;
        slug: string;
    }>;
}): Promise<Metadata> {
    let _params = await params;
    const { lang: rawLang, slug } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const brand = await data.getBrandBySlug(slug);
    if (!brand)
        return { title: 'Brand — ATORA' };
    const name = pickLocalized(brand as unknown as Record<string, unknown>, 'name', lang) || brand.name_en;
    const desc = pickLocalized(brand as unknown as Record<string, unknown>, 'description', lang) || brand.description_en;
    return {
        title: `${name} — ATORA`,
        description: desc ?? `${name} aircond products — ATORA Malaysia.`,
        alternates: langAlternates(`/${lang}/brands/${brand.slug}`),
    };
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
    return (<div className="container-fluid py-8">
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
          <p className="text-sm text-gray-500 mt-3">{products.length} products</p>
        </div>
      </header>

      {products.length === 0 ? (<div className="card p-12 text-center text-gray-500">{t(lang, 'products.noResults')}</div>) : (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (<ProductCard key={p.id} product={p} brand={brand} media={mediaMap.get(p.id)} whatsappNumber={s.whatsapp_number} lang={lang}/>))}
        </div>)}
    </div>);
}
