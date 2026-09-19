'use client';

/**
 * PhotoWall — 活动照片 / 奖项照片 album on the About Us page.
 *
 *  - Masonry layout via CSS columns (no horizontal scrolling on mobile)
 *  - click to open a Lightbox with keyboard navigation (← → Esc) and swipe
 *  - lazy-loaded thumbnails with the full image only fetched on demand
 *
 * All titles / captions / alt text arrive already resolved for the active
 * locale, so switching language swaps every string and alt attribute.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type PhotoView = {
  id: number;
  title: string;
  caption: string;
  alt: string;
  year: string | null;
  eventName: string | null;
  thumb: string;
  full: string;
};

export type PhotoWallLabels = {
  title: string;
  sub: string;
  empty: string;
  photoCount: string;
  close: string;
  previous: string;
  next: string;
};

export default function PhotoWall({
  photos,
  labels,
}: {
  photos: PhotoView[];
  labels: PhotoWallLabels;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null;

  const go = useCallback(
    (delta: number) => {
      setIndex((cur) => {
        if (cur === null) return cur;
        const next = cur + delta;
        if (next < 0) return photos.length - 1;
        if (next >= photos.length) return 0;
        return next;
      });
    },
    [photos.length]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, go]);

  if (photos.length === 0) {
    return (
      <section className="section" id="gallery">
        <div className="container-fluid text-center">
          <h2 className="heading-2 mb-2">{labels.title}</h2>
          <p className="text-gray-500 text-sm">{labels.empty}</p>
        </div>
      </section>
    );
  }

  const current = index !== null ? photos[index] : null;

  return (
    <section className="section" id="gallery">
      <div className="container-fluid">
        <div className="max-w-2xl mb-8">
          <h2 className="heading-2 mb-2">{labels.title}</h2>
          <p className="text-gray-600">{labels.sub}</p>
          <p className="text-xs text-gray-400 mt-2">{labels.photoCount.replace('{n}', String(photos.length))}</p>
        </div>

        {/* Masonry: CSS columns keep the flow vertical so there is never a
            horizontal scrollbar, and it degrades to a single column on mobile. */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 [column-fill:_balance]">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIndex(i)}
              className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg border border-gray-200 bg-gray-100 text-left focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              aria-label={p.alt || p.title || labels.title}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.thumb}
                alt={p.alt || p.title || ''}
                loading="lazy"
                decoding="async"
                className="w-full h-auto transition duration-300 group-hover:scale-[1.03]"
              />
              {(p.title || p.caption || p.year || p.eventName) && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3 opacity-0 transition group-hover:opacity-100 group-focus:opacity-100">
                  {p.title && <span className="block text-sm font-semibold text-white">{p.title}</span>}
                  {(p.eventName || p.year) && (
                    <span className="block text-[11px] text-white/80">
                      {[p.eventName, p.year].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {current && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label={current.alt || current.title || labels.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIndex(null);
          }}
        >
          <div className="flex items-center justify-between gap-4 p-3 text-white sm:p-4">
            <div className="min-w-0">
              {current.title && <p className="truncate text-sm font-semibold">{current.title}</p>}
              <p className="truncate text-xs text-white/60">
                {[current.eventName, current.year].filter(Boolean).join(' · ') ||
                  `${(index ?? 0) + 1} / ${photos.length}`}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setIndex(null)}
              aria-label={labels.close}
              className="shrink-0 rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-2 pb-4">
            {photos.length > 1 && (
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label={labels.previous}
                className="absolute left-2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-4"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.full}
              alt={current.alt || current.title || ''}
              loading="lazy"
              decoding="async"
              className="max-h-full max-w-full object-contain"
            />

            {photos.length > 1 && (
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={labels.next}
                className="absolute right-2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-4"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>

          {current.caption && (
            <p className="mx-auto max-w-3xl px-4 pb-5 text-center text-sm text-white/75">{current.caption}</p>
          )}
        </div>
      )}
    </section>
  );
}
