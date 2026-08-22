import Link from 'next/link';
import { Locale, t } from '@/lib/i18n';
import { TechnicalPartner } from '@/lib/db';

export default function PartnerCard({ partner, lang }: { partner: TechnicalPartner; lang: Locale }) {
  const name = partner.company_name_en;
  const serviceTypes = (partner.service_types ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        {partner.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={partner.logo_url} alt={name} className="h-12 w-12 object-contain rounded-md border border-gray-100 bg-white" />
        ) : (
          <div className="h-12 w-12 rounded-md bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
            {name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-brand-800 truncate">{name}</h3>
          {partner.city && (
            <p className="text-xs text-gray-500 truncate">{[partner.city, partner.state].filter(Boolean).join(', ')}</p>
          )}
        </div>
      </div>

      {serviceTypes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {serviceTypes.map((st) => (
            <span key={st} className="badge-blue">{st}</span>
          ))}
        </div>
      )}

      {partner.description_en && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-3 flex-1">{partner.description_en}</p>
      )}

      <div className="flex gap-2 mt-auto pt-2">
        <Link href={`/${lang}/technical-partners/${partner.slug}`} className="btn-secondary flex-1 text-xs">
          {t(lang, 'common.viewDetails')}
        </Link>
        {partner.show_whatsapp === 1 && partner.whatsapp && (
          <a
            href={`https://wa.me/${partner.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp text-xs flex-1"
          >
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
