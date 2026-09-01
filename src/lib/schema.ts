/**
 * schema.org / JSON-LD builders for ATORA.
 *
 * EVERY company fact (name, phone, email, address, registration no., brands,
 * locations, products, prices) is passed in from the database or site_settings.
 * Nothing is invented, and no claim of being an "official distributor" or
 * "authorised dealer" of any brand is ever emitted.
 */
import type { Brand, Category, FAQ, Location, Product, ProductMedia, TechnicalPartner } from './db';
import { Locale, pickLocalized } from './i18n';
import { SITE_URL, absoluteUrl, HREFLANG_TAGS } from './seo';

export type SiteSettings = Record<string, string>;

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** ISO-4217 for the currency stored in the DB (DB stores display codes like "RM"). */
function isoCurrency(code?: string | null): string {
  const c = (code || '').toUpperCase();
  if (c === 'RM' || c === 'MYR') return 'MYR';
  return /^[A-Z]{3}$/.test(c) ? c : 'MYR';
}

function stockToAvailability(stock?: string | null): string {
  if (stock === 'in_stock') return 'https://schema.org/InStock';
  if (stock === 'low_stock') return 'https://schema.org/LimitedAvailability';
  return 'https://schema.org/OutOfStock';
}

/** Drop undefined / null / empty values so the emitted JSON stays tight. */
function clean(node: Record<string, unknown>): Record<string, unknown> {
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (v === undefined || v === null || v === '') delete node[k];
    else if (Array.isArray(v) && v.length === 0) delete node[k];
  }
  return node;
}

function localized(row: unknown, field: string, lang: Locale, fallback = ''): string {
  return pickLocalized(row as Record<string, unknown>, field, lang) || fallback;
}

/* ------------------------------------------------------------------ *
 * Organization — emitted once per page from the [lang] layout.
 * ------------------------------------------------------------------ */
export function organizationSchema(s: SiteSettings, opts: {
  locations?: Location[];
  knowsAbout?: string[];
} = {}): Record<string, unknown> {
  const sameAs = [s.facebook, s.instagram].filter((v) => !!v && v.trim()) as string[];
  const states = Array.from(
    new Set((opts.locations ?? []).map((l) => l.state).filter((v): v is string => !!v && v.trim() !== ''))
  );

  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: s.company_name_en,
    legalName: s.company_name_en,
    alternateName: s.company_name_zh || undefined,
    description: s.seo_default_description_en || undefined,
    slogan: s.tagline_en || undefined,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: absoluteUrl('/atora-logo.png') },
    image: absoluteUrl('/atora-logo.png'),
    email: s.email || undefined,
    telephone: s.hq_phone || undefined,
    identifier: s.registration_no
      ? {
          '@type': 'PropertyValue',
          name: 'Malaysia company registration number (SSM)',
          value: s.registration_no,
        }
      : undefined,
    address: s.hq_address
      ? { '@type': 'PostalAddress', streetAddress: s.hq_address, addressCountry: 'MY' }
      : undefined,
    // Positioning: nationwide Malaysia. Kedah / Padang Serai / Sungai Petani /
    // Kulim are physical locations, not the limit of the service area.
    areaServed: [
      { '@type': 'Country', name: 'Malaysia' },
      ...states.map((st) => ({ '@type': 'State', name: st })),
    ],
    openingHours: s.opening_hours_en || undefined,
    contactPoint: [
      clean({
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: s.hq_phone || undefined,
        email: s.email || undefined,
        areaServed: 'MY',
        availableLanguage: ['en', 'ms', 'zh'],
      }),
      s.whatsapp_number
        ? {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            name: 'WhatsApp',
            telephone: s.whatsapp_number,
            url: `https://wa.me/${s.whatsapp_number.replace(/[^0-9]/g, '')}`,
            areaServed: 'MY',
            availableLanguage: ['en', 'ms', 'zh'],
          }
        : undefined,
    ].filter(Boolean),
    sameAs: sameAs.length ? sameAs : undefined,
    knowsAbout: opts.knowsAbout?.length ? opts.knowsAbout : undefined,
    // Independent multi-brand wholesaler — never an "authorised distributor".
    additionalType: 'https://schema.org/WholesaleStore',
  };

  return clean(node);
}

/* ------------------------------------------------------------------ *
 * WebSite
 * ------------------------------------------------------------------ */
export function websiteSchema(s: SiteSettings): Record<string, unknown> {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: s.company_name_en,
    description: s.seo_default_description_en || undefined,
    publisher: { '@id': ORG_ID },
    inLanguage: ['en-MY', 'ms-MY', 'zh-MY'],
  });
}

/* ------------------------------------------------------------------ *
 * WebPage
 * ------------------------------------------------------------------ */
export function webPageSchema(opts: {
  lang: Locale;
  path: string;
  title: string;
  description?: string;
  type?: string;
  breadcrumbId?: string;
  primaryId?: string;
}): Record<string, unknown> {
  const url = absoluteUrl(opts.path);
  return clean({
    '@context': 'https://schema.org',
    '@type': opts.type || 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: opts.title,
    description: opts.description || undefined,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    inLanguage: HREFLANG_TAGS[opts.lang],
    breadcrumb: opts.breadcrumbId ? { '@id': opts.breadcrumbId } : undefined,
    primaryImageOfPage: opts.primaryId ? { '@id': opts.primaryId } : undefined,
  });
}

/* ------------------------------------------------------------------ *
 * BreadcrumbList
 * ------------------------------------------------------------------ */
export function breadcrumbSchema(path: string, items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(path)}#breadcrumb`,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.url),
    })),
  };
}

/* ------------------------------------------------------------------ *
 * Product
 * ------------------------------------------------------------------ */
/** Effective unit price following the product's price_display_mode. */
function effectivePrice(p: Product): number | null {
  switch (p.price_display_mode) {
    case 'SHOW_WHOLESALE_PRICE':
      return p.wholesale_price ?? p.retail_price ?? null;
    case 'SHOW_PROMOTION_PRICE':
      return p.promotion_price ?? p.retail_price ?? null;
    case 'SHOW_PRICE_RANGE':
      return p.price_min ?? p.price_max ?? p.retail_price ?? null;
    case 'CONTACT_FOR_PRICE':
      return null;
    default:
      return p.retail_price ?? null;
  }
}

export function productSchema(opts: {
  product: Product;
  brand?: Brand | null;
  category?: Category | null;
  media?: ProductMedia[];
  settings: SiteSettings;
  lang: Locale;
  path: string;
}): Record<string, unknown> {
  const { product: p, brand, category, media, settings: s, lang, path } = opts;
  const name = localized(p, 'name', lang, p.name_en);
  const description =
    localized(p, 'description', lang) || p.seo_description_en || `${name} — supplied by ${s.company_name_en}.`;
  const images = (media ?? [])
    .filter((m) => m.type === 'image' && m.url)
    .map((m) => m.url);
  const price = effectivePrice(p);

  return clean({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(path)}#product`,
    name,
    description,
    sku: p.sku || undefined,
    productID: `ATORA-${p.id}`,
    mpn: p.model || undefined,
    category: category?.name_en || undefined,
    url: absoluteUrl(path),
    image: images.length ? images : undefined,
    brand: brand ? { '@type': 'Brand', name: brand.name_en } : undefined,
    additionalProperty: [
      clean({ '@type': 'PropertyValue', name: 'Model', value: p.model || undefined }),
      clean({ '@type': 'PropertyValue', name: 'Capacity', value: p.capacity || undefined }),
      clean({ '@type': 'PropertyValue', name: 'Type', value: p.product_type || undefined }),
      p.specifications
        ? { '@type': 'PropertyValue', name: 'Specifications', value: p.specifications }
        : undefined,
    ].filter(Boolean),
    isRelatedTo: brand ? { '@type': 'Brand', name: brand.name_en } : undefined,
    offers: price != null
      ? {
          '@type': 'Offer',
          url: absoluteUrl(path),
          priceCurrency: isoCurrency(p.currency),
          price: Number(price),
          availability: stockToAvailability(p.stock_status),
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@id': ORG_ID },
          areaServed: { '@type': 'Country', name: 'Malaysia' },
          // Wholesale pricing is confirmed on enquiry — no invented "shipping" data.
          priceValidUntil: undefined,
        }
      : {
          '@type': 'Offer',
          url: absoluteUrl(path),
          availability: stockToAvailability(p.stock_status),
          seller: { '@id': ORG_ID },
          areaServed: { '@type': 'Country', name: 'Malaysia' },
          description: 'Contact ATORA for wholesale pricing.',
        },
  });
}

/* ------------------------------------------------------------------ *
 * Service (wholesale / project supply)
 * ------------------------------------------------------------------ */
export function serviceSchema(opts: {
  settings: SiteSettings;
  lang: Locale;
  path: string;
  name: string;
  description: string;
  serviceType: string;
}): Record<string, unknown> {
  const { settings: s, path, name, description, serviceType } = opts;
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${absoluteUrl(path)}#service`,
    name,
    description,
    serviceType,
    url: absoluteUrl(path),
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Malaysia' },
    audience: [
      { '@type': 'BusinessAudience', name: 'Air conditioner installers' },
      { '@type': 'BusinessAudience', name: 'Contractors' },
      { '@type': 'BusinessAudience', name: 'Retailers' },
    ],
  });
}

/* ------------------------------------------------------------------ *
 * FAQPage
 * ------------------------------------------------------------------ */
export function faqSchema(faqs: FAQ[], lang: Locale): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: localized(f, 'question', lang, f.question_en),
      acceptedAnswer: {
        '@type': 'Answer',
        text: localized(f, 'answer', lang, f.answer_en),
      },
    })),
  };
}

/* ------------------------------------------------------------------ *
 * LocalBusiness (branch / HQ)
 * ------------------------------------------------------------------ */
export function localBusinessSchema(loc: Location, s: SiteSettings): Record<string, unknown> {
  const url = `${SITE_URL}/en/locations#${loc.slug}`;
  return clean({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#location-${loc.slug}`,
    name: loc.name_en,
    branchOf: { '@id': ORG_ID },
    parentOrganization: { '@id': ORG_ID },
    url,
    telephone: loc.telephone || s.hq_phone || undefined,
    email: loc.email || s.email || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: loc.address || undefined,
      addressLocality: loc.city || undefined,
      addressRegion: loc.state || undefined,
      postalCode: loc.postal_code || undefined,
      addressCountry: loc.country || 'MY',
    },
    geo: loc.latitude != null && loc.longitude != null
      ? { '@type': 'GeoCoordinates', latitude: loc.latitude, longitude: loc.longitude }
      : undefined,
    hasMap: loc.google_maps_url || undefined,
    openingHours: loc.opening_hours || s.opening_hours_en || undefined,
    image: loc.photo_url || undefined,
    description: loc.description_en || undefined,
    areaServed: { '@type': 'Country', name: 'Malaysia' },
  });
}

/**
 * Partner organisation — respects the per-partner privacy flags
 * (show_phone / show_whatsapp / show_email / show_address / show_website).
 */
export function partnerOrganizationSchema(p: TechnicalPartner): Record<string, unknown> {
  const contact: Record<string, unknown>[] = [];
  if (p.show_phone === 1 && p.telephone) {
    contact.push({ '@type': 'ContactPoint', contactType: 'sales', telephone: p.telephone, areaServed: p.service_area || 'MY' });
  }
  if (p.show_whatsapp === 1 && p.whatsapp) {
    contact.push({
      '@type': 'ContactPoint',
      contactType: 'customer support',
      name: 'WhatsApp',
      telephone: p.whatsapp,
      areaServed: p.service_area || 'MY',
    });
  }
  return clean({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#partner-${p.slug}`,
    name: p.company_name_en,
    url: p.show_website === 1 && p.website ? p.website : undefined,
    telephone: p.show_phone === 1 ? p.telephone || undefined : undefined,
    email: p.show_email === 1 ? p.email || undefined : undefined,
    image: p.logo_url || p.photo_url || undefined,
    description: p.description_en || undefined,
    address: p.show_address === 1
      ? {
          '@type': 'PostalAddress',
          streetAddress: p.address || undefined,
          addressLocality: p.city || undefined,
          addressRegion: p.state || undefined,
          addressCountry: p.country || 'MY',
        }
      : undefined,
    areaServed: p.service_area || undefined,
    contactPoint: contact.length ? contact : undefined,
  });
}

/* ------------------------------------------------------------------ *
 * Brand + ItemList
 * ------------------------------------------------------------------ */
export function brandSchema(opts: {
  brand: Brand;
  lang: Locale;
  path: string;
  productCount: number;
}): Record<string, unknown> {
  const { brand, lang, path, productCount } = opts;
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Brand',
    '@id': `${absoluteUrl(path)}#brand`,
    name: brand.name_en,
    alternateName: localized(brand, 'name', lang) || undefined,
    description: localized(brand, 'description', lang, brand.description_en || '') || undefined,
    logo: brand.logo || undefined,
    url: absoluteUrl(path),
    // ATORA is an independent multi-brand supplier. We deliberately do NOT
    // emit any "official distributor" / "authorised dealer" relationship.
    subjectOf: {
      '@type': 'WebPage',
      '@id': `${absoluteUrl(path)}#webpage`,
      name: `${brand.name_en} air conditioners & spare parts supplied by ATORA`,
      about: { '@id': ORG_ID },
      numberOfItems: productCount,
    },
  });
}

export function itemListSchema(opts: {
  path: string;
  name: string;
  items: { name: string; url: string; image?: string | null }[];
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${absoluteUrl(opts.path)}#itemlist`,
    name: opts.name,
    numberOfItems: opts.items.length,
    itemListElement: opts.items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: absoluteUrl(it.url),
      ...(it.image ? { image: it.image } : {}),
    })),
  };
}
