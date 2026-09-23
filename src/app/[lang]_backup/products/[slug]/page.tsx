/**
 * /products/[slug] — product detail page.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LOCALES, Locale, t, pickLocalized } from '@/lib/i18n';
import { data, resolveBrand } from '@/lib/data';
import { getAllSettings } from '@/lib/settings';
import { absoluteUrl } from '@/lib/seo';
import { buildProductEnquiryLink, pickDisplayPrice } from '@/lib/formatters';
import { buildPageMetadata } from '@/lib/seo';
import { breadcrumbSchema, productSchema, webPageSchema } from '@/lib/schema';
import ProductGallery from '@/components/ProductGallery';
import ProductCard from '@/components/ProductCard';
import JsonLd from '@/components/JsonLd';
export async function generateMetadata({ params, }: {
    params: Promise<{
        lang: string;
        slug: string;
    }>;
}): Promise<Metadata> {
    let _params = await params;
    const { lang: rawLang, slug } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const product = await data.getProductBySlug(slug);
    if (!product)
        return { title: t(lang, 'products.productNotFound'), robots: { index: false, follow: false } };
    const name = pickLocalized(product as unknown as Record<string, unknown>, 'name', lang) || product.name_en;
    const description =
        pickLocalized(product as unknown as Record<string, unknown>, 'description', lang) ||
        product.seo_description_en ||
        `${name} — Aircond wholesale & parts from ATORA Malaysia.`;
    const media = await data.listProductMedia(product.id);
    const images = media.filter((m) => m.type === 'image' && m.url).map((m) => m.url);
    return buildPageMetadata({
        lang,
        path: `/${lang}/products/${product.slug}`,
        title: product.seo_title_en && lang === 'en' ? product.seo_title_en : `${name} — ATORA`,
        description,
        images: images.slice(0, 4),
    });
}
export default async function ProductDetailPage({ params, }: {
    params: Promise<{
        lang: string;
        slug: string;
    }>;
}) {
    let _params = await params;
    const { lang: rawLang, slug } = _params;
    const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
    const product = await data.getProductBySlug(slug);
    if (!product)
        notFound();
    const s = await getAllSettings();
    const media = await data.listProductMedia(product.id);
    const brands = await data.listActiveBrands();
    const brand = resolveBrand(product, brands);
    const category = product.category_id
        ? (await data.listActiveCategories()).find((c) => c.id === product.category_id)
        : null;
    const airconGroup = (await data.listCategoryGroups()).find((g) => g.slug === 'air-conditioners');
    const isAircon = !!category && !!airconGroup && (category.parent_id === airconGroup.id || category.id === airconGroup.id);
    const price = pickDisplayPrice(product);
    const name = pickLocalized(product as unknown as Record<string, unknown>, 'name', lang) || product.name_en;
    const desc = pickLocalized(product as unknown as Record<string, unknown>, 'description', lang) || '';
    const whatsappLink = buildProductEnquiryLink({
        whatsappNumber: s.whatsapp_number,
        productName: name,
        brand: brand?.name_en,
        model: product.model,
        enquiryText: t(lang, 'common.contact'),
    });
    const stockBadge = product.stock_status === 'in_stock'
        ? { cls: 'badge-green', text: t(lang, 'products.inStock') }
        : product.stock_status === 'low_stock'
            ? { cls: 'badge-yellow', text: t(lang, 'products.lowStock') }
            : { cls: 'badge-gray', text: t(lang, 'products.outOfStock') };
    const pagePath = `/${lang}/products/${product.slug}`;
    const breadcrumbNode = breadcrumbSchema(pagePath, [
        { name: t(lang, 'nav.home'), url: `/${lang}` },
        { name: t(lang, isAircon ? 'nav.products' : 'nav.parts'), url: `/${lang}${isAircon ? '/products' : '/parts'}` },
        { name, url: pagePath },
    ]);
    const productNode = productSchema({ product, brand, category, media, settings: s, lang, path: pagePath });
    const pageNode = webPageSchema({
        lang,
        path: pagePath,
        title: name,
        description: desc || product.seo_description_en || '',
        breadcrumbId: `${absoluteUrl(pagePath)}#breadcrumb`,
    });
    // Internal linking: same-brand items first, then same-category items.
    const allProducts = await data.listActiveProducts();
    const related = allProducts
        .filter((p) => p.id !== product.id)
        .filter((p) => (brand && resolveBrand(p, brands)?.id === brand.id) || (category && p.category_id === category.id))
        .slice(0, 4);
    const relatedMedia = new Map<number, Awaited<ReturnType<typeof data.listProductMedia>>>();
    for (const rp of related) {
        relatedMedia.set(rp.id, await data.listProductMedia(rp.id));
    }
    return (<div className="container-fluid py-8">
      <JsonLd data={breadcrumbNode}/>
      <JsonLd data={productNode}/>
      <JsonLd data={pageNode}/>
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href={`/${lang}`} className="hover:text-brand-700">{t(lang, 'nav.home')}</Link>
        <span className="mx-2">/</span>
        <Link href={`/${lang}${isAircon ? '/products' : '/parts'}`} className="hover:text-brand-700">
          {t(lang, isAircon ? 'nav.products' : 'nav.parts')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-brand-700">{name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Image / gallery */}
        <div>
          <ProductGallery media={media} name={name} />
        </div>

        {/* Details */}
        <div>
          {brand && (<Link href={`/${lang}/brands/${brand.slug}`} className="inline-flex items-center gap-2 mb-2 text-sm text-brand-600 hover:text-brand-700">
              {brand.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt={brand.name_en} className="h-5 w-auto"/>)}
              {brand.name_en}
            </Link>)}
          <h1 className="heading-1 mb-3">{name}</h1>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className={stockBadge.cls}>{stockBadge.text}</span>
            {product.featured === 1 && <span className="badge-blue">Featured</span>}
            {category && <span className="badge-gray">{category.name_en}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            {product.model && (<div><span className="text-gray-500">Model:</span> <span className="font-medium">{product.model}</span></div>)}
            {product.capacity && (<div><span className="text-gray-500">Capacity:</span> <span className="font-medium">{product.capacity}</span></div>)}
            {product.product_type && (<div><span className="text-gray-500">Type:</span> <span className="font-medium">{product.product_type}</span></div>)}
            {product.sku && (<div><span className="text-gray-500">SKU:</span> <span className="font-medium">{product.sku}</span></div>)}
          </div>

          {/* Price */}
          <div className="card p-5 mb-6">
            <div className="text-xs uppercase tracking-wider text-gray-500">{price.label}</div>
            <div className="text-3xl font-bold text-brand-700 mt-1">{price.text}</div>
            {price.subtext && <div className="text-sm text-gray-400 line-through mt-1">{price.subtext}</div>}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp px-5 py-2.5 font-semibold">
              {t(lang, 'common.whatsappUs')} — {t(lang, 'common.getQuote')}
            </a>
            <Link href={`/${lang}/contact?product=${encodeURIComponent(name)}`} className="btn-primary px-5 py-2.5 font-semibold">
              {t(lang, 'common.getQuote')}
            </Link>
            {s.hq_phone && (<a href={`tel:${s.hq_phone.replace(/\s/g, '')}`} className="btn-secondary px-5 py-2.5 font-semibold">
                📞 {s.hq_phone}
              </a>)}
          </div>

          {desc && (<div className="card p-5 mb-4">
              <h3 className="font-semibold text-brand-800 mb-2">{t(lang, 'products.description')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{desc}</p>
            </div>)}

          {product.specifications && (<div className="card p-5">
              <h3 className="font-semibold text-brand-800 mb-2">{t(lang, 'products.specifications')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.specifications}</p>
            </div>)}
        </div>
      </div>

      {/* CTA — call us */}
      <div className="rounded-lg bg-brand-50 p-6 text-center">
        <p className="text-sm text-brand-800">{t(lang, 'callForEnquiry')}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">{t(lang, 'common.whatsappUs')}</a>
          <a href={`tel:${s.hq_phone.replace(/\s/g, '')}`} className="btn-primary">📞 {s.hq_phone}</a>
        </div>
      </div>

      {/* Internal linking — related catalogue items */}
      {related.length > 0 && (<section className="mt-10">
          <h2 className="heading-2 mb-4">{t(lang, 'products.related')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((rp) => (<ProductCard key={rp.id} product={rp} brand={resolveBrand(rp, brands)} media={relatedMedia.get(rp.id)} whatsappNumber={s.whatsapp_number} lang={lang}/>))}
          </div>
        </section>)}
    </div>);
}
