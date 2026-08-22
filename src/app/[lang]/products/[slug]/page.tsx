/**
 * /products/[slug] — product detail page.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LOCALES, Locale, t, langAlternates } from '@/lib/i18n';
import { data } from '@/lib/data';
import { pickLocalized } from '@/lib/i18n';
import { getAllSettings } from '@/lib/settings';
import { buildProductEnquiryLink, pickDisplayPrice } from '@/lib/formatters';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  const product = data.getProductBySlug(slug);
  if (!product) return { title: t(lang, 'products.productNotFound') };
  const name = pickLocalized(product as unknown as Record<string, unknown>, 'name', lang) || product.name_en;
  return {
    title: `${name} — ATORA`,
    description:
      pickLocalized(product as unknown as Record<string, unknown>, 'description', lang) ||
      product.seo_description_en ||
      `${name} — Aircond wholesale & parts from ATORA Malaysia.`,
    alternates: langAlternates(`/${lang}/products/${product.slug}`),
    openGraph: {
      title: name,
      description: product.seo_description_en ?? '',
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = (LOCALES as readonly string[]).includes(rawLang) ? (rawLang as Locale) : 'en';
  const product = data.getProductBySlug(slug);
  if (!product) notFound();

  const s = getAllSettings();
  const media = data.listProductMedia(product.id);
  const brand = product.brand_id ? data.listActiveBrands().find((b) => b.id === product.brand_id) : null;
  const category = product.category_id
    ? data.listActiveCategories().find((c) => c.id === product.category_id)
    : null;
  const airconGroup = data.listCategoryGroups().find((g) => g.slug === 'air-conditioners');
  const isAircon =
    !!category && !!airconGroup && (category.parent_id === airconGroup.id || category.id === airconGroup.id);
  const price = pickDisplayPrice(product);
  const name = pickLocalized(product as unknown as Record<string, unknown>, 'name', lang) || product.name_en;
  const desc = pickLocalized(product as unknown as Record<string, unknown>, 'description', lang) || '';
  const primary = media.find((m) => m.is_primary) ?? media[0];
  const gallery = media.filter((m) => m.id !== primary?.id);

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

  return (
    <div className="container-fluid py-8">
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
          <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-200 mb-3">
            {primary ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primary.url} alt={name} className="object-contain w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
            )}
          </div>
          {gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.slice(0, 4).map((m) => (
                <div key={m.id} className="aspect-square bg-gray-50 rounded overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={name} className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {brand && (
            <Link href={`/${lang}/brands/${brand.slug}`} className="inline-flex items-center gap-2 mb-2 text-sm text-brand-600 hover:text-brand-700">
              {brand.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo} alt={brand.name_en} className="h-5 w-auto" />
              )}
              {brand.name_en}
            </Link>
          )}
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
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp px-5 py-2.5 font-semibold"
            >
              {t(lang, 'common.whatsappUs')} — {t(lang, 'common.getQuote')}
            </a>
            <Link href={`/${lang}/contact?product=${encodeURIComponent(name)}`} className="btn-primary px-5 py-2.5 font-semibold">
              {t(lang, 'common.getQuote')}
            </Link>
            {s.hq_phone && (
              <a href={`tel:${s.hq_phone.replace(/\s/g, '')}`} className="btn-secondary px-5 py-2.5 font-semibold">
                📞 {s.hq_phone}
              </a>
            )}
          </div>

          {desc && (
            <div className="card p-5 mb-4">
              <h3 className="font-semibold text-brand-800 mb-2">{t(lang, 'products.description')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{desc}</p>
            </div>
          )}

          {product.specifications && (
            <div className="card p-5">
              <h3 className="font-semibold text-brand-800 mb-2">{t(lang, 'products.specifications')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.specifications}</p>
            </div>
          )}
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
    </div>
  );
}
