import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, Locale, resolveLocale } from './i18n';

const LOCALE_COOKIE = 'atora_locale';

/** Resolve the current locale from cookie / header on the server. */
export async function getServerLocale(): Promise<Locale> {
  // 1) cookie set by LanguageSwitcher
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie) return resolveLocale(fromCookie);

  // 2) Accept-Language header
  const headerStore = await headers();
  const accept = headerStore.get('accept-language') ?? '';
  for (const part of accept.split(',')) {
    const code = part.split(';')[0].trim();
    if (code) return resolveLocale(code);
  }
  return DEFAULT_LOCALE;
}

export { LOCALE_COOKIE, DEFAULT_LOCALE };
export type { Locale };
