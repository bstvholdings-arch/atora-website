import Link from 'next/link';
import { Locale, t } from '@/lib/i18n';
import { Product } from '@/lib/data';
import { pickLocalized } from '@/lib/i18n';
import { Brand, ProductMedia } from '@/lib/db';
import { pickDisplayPrice, buildProductEnquiryLink } from '@/lib/formatters';
import { getSetting } from '@/lib/settings';

// Self-contained placeholder shown when a product has no cover image.
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='400'%20height='400'%3E%3Crect%20width='100%25'%20height='100%25'%20fill='%23f3f4f6'/%3E%3Cg%20fill='none'%20stroke='%23cbd5e1'%20stroke-width='14'%3E%3Crect%20x='120'%20y='130'%20width='160'%20height='140'%20rx='10'/%3E%3Ccircle%20cx='165'%20cy='180'%20r='18'/%3E%3Cpath%20d='M128%20260%20l46%20-46%2036%2036%2028%20-28%2050%2050'/%3E%3C/g%3E%3C/svg%3E";

export type ProductCardProps = {
  product: Product;
  brand?: Brand | null;
  media?: ProductMedia[];
  whatsappNumber: string;
  lang: Locale;
};

export default function ProductCard({ product, brand, media, whatsappNumber, lang }: ProductCardProps) {
  const displayName = pickLocalized(product as unknown as Record<string, unknown>, 'name', lang) || product.name_en;
  const desc = pickLocalized(product as unknown as Record<string, unknown>, 'description', lang) || '';

  const primary = media?.find((m) => m.is_primary)?.url ?? media?.[0]?.url;
  const price = pickDisplayPrice(product);
  const href = `/${lang}/products/${product.slug}`;
  const whatsappMessage = buildProductEnquiryLink({
    whatsappNumber,
    productName: displayName,
    brand: brand?.name_en ?? null,
    model: product.model,
    enquiryText: t(lang, 'nav.contact'),
  });

  return (
    <div className="card overflow-hidden flex flex-col">
      <Link href={href} className="block relative aspect-square bg-gray-50 overflow-hidden">
        {primary ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primary} alt={displayName} className="object-cover w-full h-full hover:scale-105 transition duration-300" loading="lazy" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={PLACEHOLDER_IMAGE} alt="No image available" className="object-cover w-full h-full opacity-90" loading="lazy" />
        )}
        {product.featured === 1 && (
          <span className="absolute top-2 left-2 badge-blue">Featured</span>
        )}
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        {brand && (
          <div className="text-xs text-gray-500 mb-1">{brand.name_en}</div>
        )}
        <Link href={href} className="font-semibold text-brand-800 hover:text-brand-700 line-clamp-2">
          {displayName}
        </Link>
        {product.model && (
          <div className="text-xs text-gray-500 mt-0.5">Model: {product.model}</div>
        )}
        {product.capacity && (
          <div className="text-xs text-gray-500">{product.capacity}</div>
        )}
        <div className="mt-auto pt-3">
          <div className="text-sm">
            <span className="block text-xs text-gray-500">{price.label}</span>
            <span className="font-bold text-brand-700">{price.text}</span>
            {price.subtext && <span className="ml-2 text-xs text-gray-400 line-through">{price.subtext}</span>}
          </div>
          <div className="flex gap-2 mt-3">
            <Link href={href} className="btn-secondary flex-1 text-xs">{t(lang, 'common.viewDetails')}</Link>
            <a href={whatsappMessage} target="_blank" rel="noopener noreferrer" className="btn-whatsapp text-xs flex-1">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
