import Link from 'next/link';
import { Locale, t } from '@/lib/i18n';
import { Product } from '@/lib/data';
import { pickLocalized } from '@/lib/i18n';
import { Brand, ProductMedia } from '@/lib/db';
import { pickDisplayPrice, buildProductEnquiryLink } from '@/lib/formatters';
import { getSetting } from '@/lib/settings';

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
          <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
            No image
          </div>
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
