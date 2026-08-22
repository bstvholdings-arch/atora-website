import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, resolveLocale } from '@/lib/i18n';

/**
 * Root entry — redirect to the user's preferred locale.
 * Default: /en. Cookie: atora_locale wins.
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get('atora_locale')?.value;
  const locale = fromCookie ? resolveLocale(fromCookie) : DEFAULT_LOCALE;
  redirect(`/${locale}`);
}
