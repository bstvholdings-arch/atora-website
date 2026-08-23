import Link from 'next/link';
import { Locale, t } from '@/lib/i18n';
import { Brand } from '@/lib/db';
import BrandLogo from './BrandLogos';

export default function BrandCard({ brand, lang }: { brand: Brand; lang: Locale }) {
  return (
    <Link
      href={`/${lang}/brands/${brand.slug}`}
      className="card flex flex-col items-center justify-center p-6 hover:border-brand-300 hover:bg-brand-50/50 transition"
    >
      {brand.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logo} alt={brand.name_en} className="h-12 w-auto object-contain mb-3" />
      ) : (
        <div className="h-14 w-full flex items-center justify-center mb-3">
          <BrandLogo slug={brand.slug} className="h-10 w-auto" />
        </div>
      )}
      <div className="font-semibold text-brand-800 text-center">{brand.name_en}</div>
    </Link>
  );
}
