'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LOCALES, LOCALE_LABELS, Locale } from '@/lib/i18n';

export default function LanguageSwitcher({ current, size = 'md' }: { current: Locale; size?: 'sm' | 'md' }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  const switchTo = async (next: Locale) => {
    if (next === current) return;
    setPending(true);
    // Persist preference for direct visits.
    document.cookie = `atora_locale=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
    // Locale is driven by the URL segment, so rewrite it and navigate there.
    const rest = (pathname || `/${current}`).replace(/^\/[^/]+/, '');
    router.push(`/${next}${rest}`);
  };

  const sizeClass =
    size === 'sm'
      ? 'text-xs px-2 py-0.5'
      : 'text-sm px-3 py-1';

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-white p-0.5">
      {LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchTo(loc)}
          disabled={pending}
          className={[
            'rounded transition font-medium',
            sizeClass,
            current === loc
              ? 'bg-brand-600 text-white'
              : 'text-brand-700 hover:bg-brand-50',
          ].join(' ')}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
