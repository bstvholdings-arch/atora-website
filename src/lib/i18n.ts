/**
 * i18n helpers — lightweight server-side translation loader.
 * Languages: en (English), bm (Bahasa Malaysia), zh (简体中文)
 */
import en from '@/messages/en.json';
import bm from '@/messages/bm.json';
import zh from '@/messages/zh.json';

export type Locale = 'en' | 'bm' | 'zh';
export const LOCALES: Locale[] = ['en', 'bm', 'zh'];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  bm: 'BM',
  zh: '中文',
};

const messages: Record<Locale, Record<string, unknown>> = {
  en,
  bm,
  zh,
};

/** Flatten a nested object into dot-notation keys: {a:{b:1}} -> {"a.b":1}. */
function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flatten(value as Record<string, unknown>, fullKey));
    } else {
      out[fullKey] = String(value ?? '');
    }
  }
  return out;
}

const flatMessages: Record<Locale, Record<string, string>> = {
  en: flatten(en as Record<string, unknown>),
  bm: flatten(bm as Record<string, unknown>),
  zh: flatten(zh as Record<string, unknown>),
};

/** Resolve a locale string with safe fallback. */
export function resolveLocale(input: string | undefined | null): Locale {
  if (!input) return DEFAULT_LOCALE;
  const lower = input.toLowerCase();
  if (lower === 'en' || lower === 'english') return 'en';
  if (lower === 'bm' || lower === 'ms' || lower === 'bahasa' || lower === 'malay') return 'bm';
  if (lower === 'zh' || lower === 'cn' || lower === 'chinese' || lower === '中文') return 'zh';
  return DEFAULT_LOCALE;
}

/**
 * Get a translation by dot key for a given locale, with fallback to English.
 */
export function t(locale: Locale, key: string, fallback?: string): string {
  const table = flatMessages[locale] ?? flatMessages.en;
  if (key in table) return table[key];
  if (locale !== 'en' && key in flatMessages.en) return flatMessages.en[key];
  return fallback ?? key;
}

/** Get the entire namespace (object tree) for a locale. */
export function getMessages(locale: Locale): Record<string, unknown> {
  return messages[locale] ?? messages.en;
}

/** Get a localised field from a DB row, e.g. name_en / name_bm / name_zh. */
export function pickLocalized<T extends Record<string, unknown>>(
  row: T | null | undefined,
  baseField: string,
  locale: Locale
): string {
  if (!row) return '';
  const map: Record<Locale, string> = { en: 'en', bm: 'bm', zh: 'zh' };
  const val = row[`${baseField}_${map[locale]}`];
  if (val && String(val).trim()) return String(val);
  // Fallback to English
  const fb = row[`${baseField}_en`];
  return fb ? String(fb) : '';
}

/**
 * Build SEO alternates (canonical + hreflang) for a locale-aware page.
 * `canonicalPath` is the full path including the locale, e.g. "/en/products".
 */
export function langAlternates(canonicalPath: string) {
  const rest = canonicalPath.replace(/^\/[^/]+/, '');
  const make = (l: Locale) => `/${l}${rest}`;
  return {
    canonical: canonicalPath,
    languages: { en: make('en'), bm: make('bm'), zh: make('zh') } as Record<Locale, string>,
  };
}
