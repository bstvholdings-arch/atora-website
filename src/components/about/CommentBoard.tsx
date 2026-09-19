'use client';

/**
 * CommentBoard — 留言 / 祝福 / 客户评价 block on the About Us page.
 *
 *  - public list shows APPROVED comments only, newest-first, paginated
 *  - the form posts to POST /api/about/comments; every submission lands in the
 *    "pending" queue and is invisible until an admin approves it
 *  - honeypot field + optional Google reCAPTCHA + server-side rate limiting
 *  - email / phone are collected for follow-up and are NEVER rendered here
 *  - the message is rendered as plain text, so injected markup can never execute
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type PublicCommentView = {
  id: number;
  name: string;
  message: string;
  rating: number | null;
  awardTitle: string | null;
  createdAt: string;
};

export type CommentLabels = {
  title: string;
  sub: string;
  formName: string;
  formEmail: string;
  formPhone: string;
  formMessage: string;
  formRating: string;
  formAward: string;
  formAwardNone: string;
  formSubmit: string;
  formPrivacy: string;
  success: string;
  error: string;
  rateLimited: string;
  errName: string;
  errMessage: string;
  errEmail: string;
  errPhone: string;
  errCaptcha: string;
  listTitle: string;
  empty: string;
  sortNewest: string;
  sortOldest: string;
  prev: string;
  next: string;
  pageOf: string;
};

type AwardOption = { id: number; title: string };

const EMPTY_FORM = { name: '', email: '', phone: '', message: '', rating: '', awardId: '' };

export default function CommentBoard({
  lang,
  labels,
  awards,
  initialComments,
  initialTotal,
  perPage = 6,
  recaptchaSiteKey = '',
}: {
  lang: string;
  labels: CommentLabels;
  awards: AwardOption[];
  initialComments: PublicCommentView[];
  initialTotal: number;
  perPage?: number;
  recaptchaSiteKey?: string;
}) {
  const [comments, setComments] = useState<PublicCommentView[]>(initialComments);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const captchaRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  /* ---------------------------------------------------------------- list */

  const load = useCallback(
    async (nextPage: number, nextOrder: 'newest' | 'oldest') => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/about/comments?status=approved&page=${nextPage}&per_page=${perPage}&order=${nextOrder}&lang=${lang}`,
          { cache: 'no-store' }
        );
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          comments?: {
            id: number;
            name: string;
            message: string;
            rating: number | null;
            award_title: string | null;
            created_at: string;
          }[];
          total?: number;
        };
        if (data.ok && Array.isArray(data.comments)) {
          setComments(
            data.comments.map((c) => ({
              id: c.id,
              name: c.name,
              message: c.message,
              rating: c.rating,
              awardTitle: c.award_title,
              createdAt: c.created_at,
            }))
          );
          setTotal(data.total ?? 0);
        }
      } catch {
        /* keep the current page on a transient network error */
      } finally {
        setLoading(false);
      }
    },
    [lang, perPage]
  );

  function changePage(next: number) {
    const clamped = Math.min(Math.max(next, 1), totalPages);
    if (clamped === page) return;
    setPage(clamped);
    void load(clamped, order);
  }

  function changeOrder(next: 'newest' | 'oldest') {
    if (next === order) return;
    setOrder(next);
    setPage(1);
    void load(1, next);
  }

  /* ----------------------------------------------------------- reCAPTCHA */

  useEffect(() => {
    if (!recaptchaSiteKey) return;
    if (!document.getElementById('atora-recaptcha')) {
      const s = document.createElement('script');
      s.id = 'atora-recaptcha';
      s.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
    const timer = window.setInterval(() => {
      const g = window.grecaptcha;
      const el = captchaRef.current;
      if (g?.render && el && el.childElementCount === 0) {
        g.render(el, { sitekey: recaptchaSiteKey });
        window.clearInterval(timer);
      }
    }, 300);
    return () => window.clearInterval(timer);
  }, [recaptchaSiteKey]);

  /* ---------------------------------------------------------------- form */

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = labels.errName;
    if (form.message.trim().length < 5) errs.message = labels.errMessage;
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = labels.errEmail;
    if (form.phone.trim() && (form.phone.replace(/[^\d]/g, '').length < 7)) errs.phone = labels.errPhone;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (!validate()) return;

    // Hidden field: a real visitor never fills this in.
    if (honeypot.trim()) {
      setFeedback({ kind: 'ok', text: labels.success });
      setForm({ ...EMPTY_FORM });
      return;
    }

    setSubmitting(true);
    try {
      const token = recaptchaSiteKey ? window.grecaptcha?.getResponse?.() ?? '' : '';
      if (recaptchaSiteKey && !token) {
        setFeedback({ kind: 'err', text: labels.errCaptcha });
        return;
      }

      const res = await fetch('/api/about/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
          rating: form.rating || null,
          award_id: form.awardId || null,
          lang,
          page: 'about',
          recaptchaToken: token,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (res.ok && data.ok) {
        setFeedback({ kind: 'ok', text: labels.success });
        setForm({ ...EMPTY_FORM });
        setFieldErrors({});
        window.grecaptcha?.reset?.();
      } else if (data.error === 'rate_limited') {
        setFeedback({ kind: 'err', text: labels.rateLimited });
      } else if (data.error === 'invalid_input') {
        setFeedback({ kind: 'err', text: labels.errMessage });
      } else if (data.error === 'recaptcha_failed') {
        setFeedback({ kind: 'err', text: labels.errCaptcha });
      } else {
        setFeedback({ kind: 'err', text: labels.error });
      }
    } catch {
      setFeedback({ kind: 'err', text: labels.error });
    } finally {
      setSubmitting(false);
    }
  }

  /* ----------------------------------------------------------------- UI */

  return (
    <section className="section bg-gray-50/60" id="comments">
      <div className="container-fluid">
        <div className="max-w-2xl mb-8">
          <h2 className="heading-2 mb-2">{labels.title}</h2>
          <p className="text-gray-600">{labels.sub}</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* ---- Form ---- */}
          <form onSubmit={submit} className="card p-5 lg:col-span-2 space-y-3 h-fit" noValidate>
            <div>
              <label className="label" htmlFor="cm-name">
                {labels.formName} *
              </label>
              <input
                id="cm-name"
                className="input"
                value={form.name}
                maxLength={80}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                aria-invalid={!!fieldErrors.name}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="label" htmlFor="cm-email">
                {labels.formEmail}
              </label>
              <input
                id="cm-email"
                type="email"
                className="input"
                value={form.email}
                maxLength={160}
                autoComplete="email"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="label" htmlFor="cm-phone">
                {labels.formPhone}
              </label>
              <input
                id="cm-phone"
                type="tel"
                className="input"
                value={form.phone}
                maxLength={40}
                autoComplete="tel"
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                aria-invalid={!!fieldErrors.phone}
              />
              {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
            </div>

            <div>
              <label className="label" htmlFor="cm-message">
                {labels.formMessage} *
              </label>
              <textarea
                id="cm-message"
                className="input"
                rows={4}
                maxLength={2000}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                aria-invalid={!!fieldErrors.message}
              />
              {fieldErrors.message && <p className="mt-1 text-xs text-red-600">{fieldErrors.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="cm-rating">
                  {labels.formRating}
                </label>
                <select
                  id="cm-rating"
                  className="input"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                >
                  <option value="">—</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {'★'.repeat(n)}
                    </option>
                  ))}
                </select>
              </div>

              {awards.length > 0 && (
                <div>
                  <label className="label" htmlFor="cm-award">
                    {labels.formAward}
                  </label>
                  <select
                    id="cm-award"
                    className="input"
                    value={form.awardId}
                    onChange={(e) => setForm({ ...form, awardId: e.target.value })}
                  >
                    <option value="">{labels.formAwardNone}</option>
                    {awards.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Honeypot — hidden from humans, irresistible to bots. */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="cm-website">Website</label>
              <input
                id="cm-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {recaptchaSiteKey && <div ref={captchaRef} className="overflow-hidden" />}

            <p className="text-[11px] leading-relaxed text-gray-500">{labels.formPrivacy}</p>

            {feedback && (
              <p
                role="status"
                className={`rounded-md border p-2.5 text-sm ${
                  feedback.kind === 'ok'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {feedback.text}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? '…' : labels.formSubmit}
            </button>
          </form>

          {/* ---- List ---- */}
          <div className="lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold text-brand-800">{labels.listTitle}</h3>
              <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1" role="group">
                <button
                  type="button"
                  onClick={() => changeOrder('newest')}
                  aria-pressed={order === 'newest'}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    order === 'newest' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:text-brand-700'
                  }`}
                >
                  {labels.sortNewest}
                </button>
                <button
                  type="button"
                  onClick={() => changeOrder('oldest')}
                  aria-pressed={order === 'oldest'}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    order === 'oldest' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:text-brand-700'
                  }`}
                >
                  {labels.sortOldest}
                </button>
              </div>
            </div>

            {comments.length === 0 ? (
              <p className="card p-6 text-sm text-gray-500">{labels.empty}</p>
            ) : (
              <ul className={`space-y-3 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
                {comments.map((c) => (
                  <li key={c.id} className="card p-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                      <span className="font-semibold text-brand-800">{c.name}</span>
                      {c.rating != null && (
                        <span className="text-amber-500 text-sm" aria-label={`${c.rating}/5`}>
                          {'★'.repeat(c.rating)}
                          <span className="text-gray-300">{'★'.repeat(5 - c.rating)}</span>
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                    {c.awardTitle && <p className="text-xs text-brand-600 mb-1">🏆 {c.awardTitle}</p>}
                    {/* Plain text only — React escapes it, so no XSS is possible. */}
                    <p className="whitespace-pre-line break-words text-sm leading-relaxed text-gray-700">
                      {c.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={page <= 1 || loading}
                  onClick={() => changePage(page - 1)}
                >
                  {labels.prev}
                </button>
                <span className="text-xs text-gray-500">
                  {labels.pageOf.replace('{page}', String(page)).replace('{total}', String(totalPages))}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={page >= totalPages || loading}
                  onClick={() => changePage(page + 1)}
                >
                  {labels.next}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/* Minimal typing for the optional reCAPTCHA global. */
declare global {
  interface Window {
    grecaptcha?: {
      render: (el: HTMLElement, opts: { sitekey: string }) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
  }
}
