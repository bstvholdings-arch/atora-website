/**
 * Build a WhatsApp deep-link with a prefilled message.
 * Phone should be in international format without '+' or spaces (e.g. 60103838222).
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/**
 * Build a WhatsApp link for product enquiry, using settings.number and
 * the current product name.
 */
export function buildProductEnquiryLink(opts: {
  whatsappNumber: string;
  productName: string;
  brand?: string | null;
  model?: string | null;
  quantity?: string | null;
  enquiryText: string;
}): string {
  const lines = [
    `Hi ATORA, I would like to enquire about:`,
    ``,
    `Product: ${opts.productName}`,
  ];
  if (opts.brand) lines.push(`Brand: ${opts.brand}`);
  if (opts.model) lines.push(`Model: ${opts.model}`);
  if (opts.quantity) lines.push(`Quantity: ${opts.quantity}`);
  lines.push('', 'Please provide price and availability.');
  return buildWhatsAppLink(opts.whatsappNumber, lines.join('\n'));
}

/**
 * Format price in MYR.
 */
export function formatPrice(value: number | null | undefined, currency = 'RM'): string {
  if (value == null) return '';
  return `${currency} ${value.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Format price range: "RM 1,099 — RM 1,299"
 */
export function formatPriceRange(min: number | null, max: number | null, currency = 'RM'): string {
  const a = formatPrice(min, currency);
  const b = formatPrice(max, currency);
  if (a && b) return `${a} — ${b}`;
  return a || b;
}

/**
 * Pick the appropriate price to display based on the product's price_display_mode.
 */
export function pickDisplayPrice(p: {
  retail_price: number | null;
  wholesale_price: number | null;
  promotion_price: number | null;
  price_min: number | null;
  price_max: number | null;
  price_display_mode: string;
  currency: string;
}): {
  label: string;
  text: string;
  subtext: string;
} {
  const mode = p.price_display_mode || 'SHOW_PRICE';
  const currency = p.currency || 'RM';

  switch (mode) {
    case 'SHOW_WHOLESALE_PRICE':
      return {
        label: 'Wholesale Price',
        text: formatPrice(p.wholesale_price, currency),
        subtext: formatPrice(p.retail_price, currency) ? `Retail ${formatPrice(p.retail_price, currency)}` : '',
      };
    case 'SHOW_PROMOTION_PRICE':
      return {
        label: 'Promotion Price',
        text: formatPrice(p.promotion_price, currency),
        subtext: formatPrice(p.retail_price, currency) ? `Was ${formatPrice(p.retail_price, currency)}` : '',
      };
    case 'SHOW_PRICE_RANGE':
      return {
        label: 'Price Range',
        text: p.price_min != null ? `From ${formatPrice(p.price_min, currency)}` : formatPrice(p.price_max, currency),
        subtext: '',
      };
    case 'CONTACT_FOR_PRICE':
      return { label: 'Pricing', text: 'Contact for Price', subtext: '' };
    case 'SHOW_PRICE':
    default:
      return {
        label: 'Price',
        text: formatPrice(p.retail_price, currency),
        subtext: '',
      };
  }
}

/**
 * Build a Google Maps Directions URL.
 * Prefers Place ID; falls back to address / lat,lng.
 */
export function buildDirectionsUrl(opts: {
  placeId?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): string {
  if (opts.placeId) {
    return `https://www.google.com/maps/dir/?api=1&destination_place_id=${encodeURIComponent(opts.placeId)}`;
  }
  if (opts.address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(opts.address)}`;
  }
  if (opts.latitude != null && opts.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${opts.latitude},${opts.longitude}`;
  }
  return '';
}

/** Build a Google Maps embed URL for an `<iframe>`. */
export function buildMapsEmbedUrl(opts: {
  placeId?: string | null;
  address?: string | null;
}): string {
  if (opts.placeId) {
    return `https://www.google.com/maps/embed/v1/place?key=&q=place_id:${encodeURIComponent(opts.placeId)}`;
  }
  if (opts.address) {
    return `https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(opts.address)}`;
  }
  return '';
}
