/**
 * Central SEO / GEO (Generative Engine Optimisation) helpers.
 *
 * Rules:
 *  - No company facts are hard-coded here. Names, phones, addresses, emails and
 *    brand lists are always passed in from the database / site_settings.
 *  - Only structural labels and URL logic live in this file.
 */
import type { Metadata } from 'next';
import { LOCALES, Locale, HREFLANG_TAGS, langAlternates } from './i18n';

/** Public origin, e.g. "https://atora.com.my" (no trailing slash). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://atora.com.my').replace(/\/+$/, '');

/** og:locale uses underscores, hreflang uses hyphens. */
export const OG_LOCALE: Record<Locale, string> = {
  en: 'en_MY',
  bm: 'ms_MY',
  zh: 'zh_MY',
};

export { HREFLANG_TAGS };

/** Canonical + hreflang alternates for a locale-aware path. */
export const buildAlternates = langAlternates;

/** Turn "/en/products" into "https://atora.com.my/en/products". */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Strip a leading locale segment: "/en/products/x" -> "/products/x". */
export function stripLocale(path: string): string {
  return path.replace(/^\/[^/]+/, '');
}

/** All locale variants of a locale-aware path, keyed by BCP-47 tag. */
export function hreflangUrls(pathWithLocale: string): Record<string, string> {
  return buildAlternates(pathWithLocale).languages;
}

/** Default social share image (lives in /public). */
export const DEFAULT_OG_IMAGE = '/atora-logo.png';

type PageMetaInput = {
  lang: Locale;
  /** Path including the locale, e.g. "/en/products". */
  path: string;
  title: string;
  description: string;
  /** Extra social image(s). Absolute or root-relative. */
  images?: string[];
  type?: 'website' | 'article';
  /** Set false for thin / filtered / duplicate URLs. */
  indexable?: boolean;
};

/**
 * Build the full Next.js `Metadata` object for a public page:
 * title, description, canonical + hreflang, Open Graph, Twitter card, robots.
 */
export function buildPageMetadata({
  lang,
  path,
  title,
  description,
  images,
  type = 'website',
  indexable = true,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const ogImages = (images && images.length ? images : [DEFAULT_OG_IMAGE]).map((src) => ({
    url: absoluteUrl(src),
    alt: title,
  }));
  const languages = hreflangUrls(path);

  return {
    title,
    description,
    alternates: { canonical: path, languages },
    openGraph: {
      type,
      url,
      siteName: 'ATORA',
      locale: OG_LOCALE[lang],
      alternateLocale: LOCALES.filter((l) => l !== lang).map((l) => OG_LOCALE[l]),
      title,
      description,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
    robots: indexable
      ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } }
      : { index: false, follow: true },
    other: {
      // Machine-readable language signal (used by crawlers & AI answer engines).
      'content-language': HREFLANG_TAGS[lang],
    },
  };
}
