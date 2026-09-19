'use client';

/**
 * AwardsSection — 奖项与奖牌 block on the About Us page.
 *
 *  - Grid and Timeline layouts, switchable, both fully responsive
 *  - every card shows the medal photo, name, year, issuer and a short summary
 *  - "Read the award story" opens an accessible modal with the full story and
 *    a link to the dedicated, SEO-indexed award page
 *
 * All text is pre-resolved server-side for the active locale, so switching
 * language re-renders the whole block with the correct strings.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export type AwardView = {
  id: number;
  slug: string;
  year: string | null;
  award_date: string | null;
  title: string;
  issuer: string;
  summary: string;
  story: string;
  cover: string | null;
  coverThumb: string | null;
  media: { id: number; url: string; thumb: string; alt: string; caption: string }[];
};

export type AwardsLabels = {
  title: string;
  sub: string;
  viewGrid: string;
  viewTimeline: string;
  readStory: string;
  issuedBy: string;
  close: string;
  openFullPage: string;
  storyTitle: string;
  empty: string;
};

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 13v4m-3 3h6m-5 0 .5-3h3l.5 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function AwardsSection({
  awards,
  labels,
  lang,
  defaultLayout = 'grid',
}: {
  awards: AwardView[];
  labels: AwardsLabels;
  lang: string;
  defaultLayout?: 'grid' | 'timeline';
}) {
  const [layout, setLayout] = useState<'grid' | 'timeline'>(defaultLayout);
  const [open, setOpen] = useState<AwardView | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Close the modal with Escape and lock background scrolling while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (awards.length === 0) {
    return (
      <section className="section bg-gray-50/60" id="awards">
        <div className="container-fluid text-center">
          <h2 className="heading-2 mb-2">{labels.title}</h2>
          <p className="text-gray-500 text-sm">{labels.empty}</p>
        </div>
      </section>
    );
  }

  // Timeline is chronological (oldest → newest reads top-down like a history).
  const timeline = [...awards].sort((a, b) => {
    const ay = Number(a.year) || 0;
    const by = Number(b.year) || 0;
    if (ay !== by) return ay - by;
    return a.id - b.id;
  });

  return (
    <section className="section bg-gray-50/60" id="awards">
      <div className="container-fluid">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <h2 className="heading-2 mb-2">{labels.title}</h2>
            <p className="text-gray-600">{labels.sub}</p>
          </div>

          {/* Layout switch */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1" role="group">
            <button
              type="button"
              onClick={() => setLayout('grid')}
              aria-pressed={layout === 'grid'}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                layout === 'grid' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:text-brand-700'
              }`}
            >
              ▦ {labels.viewGrid}
            </button>
            <button
              type="button"
              onClick={() => setLayout('timeline')}
              aria-pressed={layout === 'timeline'}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                layout === 'timeline' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:text-brand-700'
              }`}
            >
              ⌛ {labels.viewTimeline}
            </button>
          </div>
        </div>

        {layout === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {awards.map((a) => (
              <AwardCard key={a.id} award={a} labels={labels} lang={lang} onOpen={() => setOpen(a)} />
            ))}
          </div>
        ) : (
          <ol className="relative border-l-2 border-brand-100 ml-3 sm:ml-6 space-y-8">
            {timeline.map((a) => (
              <li key={a.id} className="relative pl-6 sm:pl-10">
                <span className="absolute -left-[11px] top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 ring-4 ring-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                {a.year && (
                  <span className="inline-block rounded-full bg-brand-100 px-3 py-0.5 text-xs font-semibold text-brand-800 mb-2">
                    {a.year}
                  </span>
                )}
                <div className="card overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-44 shrink-0 bg-gray-100">
                      {a.coverThumb || a.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.coverThumb || a.cover || ''}
                          alt={a.title}
                          loading="lazy"
                          className="h-40 w-full object-cover sm:h-full"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center text-gray-300 sm:h-full">
                          <TrophyIcon />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1">
                      <h3 className="heading-3 mb-1">{a.title}</h3>
                      {a.issuer && (
                        <p className="text-sm text-gray-500 mb-3">
                          {labels.issuedBy}: <span className="text-gray-700">{a.issuer}</span>
                        </p>
                      )}
                      {a.summary && <p className="text-sm text-gray-600 leading-relaxed mb-4">{a.summary}</p>}
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn-primary" onClick={() => setOpen(a)}>
                          {labels.readStory}
                        </button>
                        <Link href={`/${lang}/about/awards/${a.slug}`} className="btn-secondary">
                          {labels.openFullPage}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {open && (
        <AwardStoryModal
          award={open}
          labels={labels}
          lang={lang}
          closeRef={closeRef}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function AwardCard({
  award,
  labels,
  lang,
  onOpen,
}: {
  award: AwardView;
  labels: AwardsLabels;
  lang: string;
  onOpen: () => void;
}) {
  return (
    <article className="card overflow-hidden flex flex-col">
      <div className="relative bg-gradient-to-br from-brand-50 to-brand-100 aspect-[4/3]">
        {award.coverThumb || award.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={award.coverThumb || award.cover || ''}
            alt={award.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-300">
            <TrophyIcon />
          </div>
        )}
        {award.year && (
          <span className="absolute top-3 left-3 rounded-full bg-brand-700/90 px-3 py-1 text-xs font-semibold text-white">
            {award.year}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-brand-900 text-lg leading-snug mb-1">{award.title}</h3>
        {award.issuer && (
          <p className="text-xs text-gray-500 mb-3">
            {labels.issuedBy}: <span className="text-gray-700">{award.issuer}</span>
          </p>
        )}
        {award.summary && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">{award.summary}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={onOpen}>
            {labels.readStory}
          </button>
          <Link href={`/${lang}/about/awards/${award.slug}`} className="btn-ghost" aria-label={labels.openFullPage}>
            {labels.openFullPage}
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */

function AwardStoryModal({
  award,
  labels,
  lang,
  closeRef,
  onClose,
}: {
  award: AwardView;
  labels: AwardsLabels;
  lang: string;
  closeRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
}) {
  const [active, setActive] = useState(0);
  const images = award.media.length
    ? award.media
    : award.cover
      ? [{ id: 0, url: award.cover, thumb: award.coverThumb || award.cover, alt: award.title, caption: '' }]
      : [];
  const current = images[Math.min(active, Math.max(images.length - 1, 0))];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={award.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl my-4">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-4 sm:p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {award.year && <span className="badge-blue">{award.year}</span>}
              {award.issuer && <span className="text-xs text-gray-500">{award.issuer}</span>}
            </div>
            <h3 className="heading-3">{award.title}</h3>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={labels.close}
            className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {images.length > 0 && (
            <div className="mb-5">
              <div className="overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.url}
                  alt={current.alt || award.title}
                  loading="lazy"
                  className="mx-auto max-h-[46vh] w-auto object-contain"
                />
              </div>
              {current.caption && <p className="mt-2 text-center text-xs text-gray-500">{current.caption}</p>}
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {images.map((m, i) => (
                    <button
                      key={`${m.id}-${i}`}
                      type="button"
                      onClick={() => setActive(i)}
                      aria-label={m.alt || `${award.title} ${i + 1}`}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded border-2 ${
                        i === active ? 'border-brand-600' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{labels.storyTitle}</h4>
          {award.story ? (
            <p className="whitespace-pre-line text-gray-700 leading-relaxed">{award.story}</p>
          ) : (
            award.summary && <p className="whitespace-pre-line text-gray-700 leading-relaxed">{award.summary}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={`/${lang}/about/awards/${award.slug}`} className="btn-primary">
              {labels.openFullPage}
            </Link>
            <button type="button" className="btn-secondary" onClick={onClose}>
              {labels.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
