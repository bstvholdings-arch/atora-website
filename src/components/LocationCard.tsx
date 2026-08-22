import Link from 'next/link';
import { Locale, t } from '@/lib/i18n';
import { Location } from '@/lib/db';
import { buildDirectionsUrl } from '@/lib/formatters';
import { pickLocalized } from '@/lib/i18n';

export default function LocationCard({ location, lang }: { location: Location; lang: Locale }) {
  const name = pickLocalized(location as unknown as Record<string, unknown>, 'name', lang) || location.name_en;
  const directions = buildDirectionsUrl({
    placeId: location.google_maps_place_id,
    address: location.address ?? undefined,
    latitude: location.latitude,
    longitude: location.longitude,
  });

  const typeLabel =
    location.is_hq === 1
      ? t(lang, 'locations.hq')
      : location.type === 'warehouse'
        ? t(lang, 'locations.warehouse')
        : t(lang, 'locations.branch');

  return (
    <div className="card overflow-hidden flex flex-col">
      {location.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={location.photo_url} alt={name} className="h-40 w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-40 w-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-brand-800">{name}</h3>
          <span className="badge-blue">{typeLabel}</span>
        </div>
        {location.address && (
          <p className="text-sm text-gray-600 mb-3">
            {location.address}<br/>
            {[location.postal_code, location.city, location.state].filter(Boolean).join(', ')}
          </p>
        )}
        {location.opening_hours && (
          <p className="text-xs text-gray-500 mb-3">{t(lang, 'locations.hours')}: {location.opening_hours}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          {location.telephone && (
            <a href={`tel:${location.telephone.replace(/\s/g, '')}`} className="btn-primary text-xs">
              {t(lang, 'common.callNow')}
            </a>
          )}
          {location.whatsapp && (
            <a
              href={`https://wa.me/${location.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp text-xs"
            >
              WhatsApp
            </a>
          )}
          {location.google_maps_url && (
            <a href={location.google_maps_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
              {t(lang, 'locations.viewOnMaps')}
            </a>
          )}
          {directions && (
            <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
              {t(lang, 'locations.directions')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
