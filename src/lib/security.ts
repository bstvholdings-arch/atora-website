/**
 * Security helpers for public input (comment board, enquiry forms).
 *
 *  - `escapeHtml` / `sanitizePlainText` — XSS defence. Public input is stored as
 *    plain text and escaped on output; HTML tags and control characters are
 *    stripped before the row is written.
 *  - `getClientIp` — best-effort client IP from the usual proxy headers.
 *  - `rateLimit` — small in-process sliding-window limiter (per IP + bucket).
 *    Good enough for a single-region serverless deployment; a distributed
 *    limiter (Upstash / Redis) can replace it without changing call sites.
 *  - `verifyRecaptcha` — optional Google reCAPTCHA v2/v3 verification. Skipped
 *    entirely when `RECAPTCHA_SECRET_KEY` is not configured.
 *  - `isHoneypotTripped` — hidden-field bot trap.
 *
 * NOTE: nothing here ever logs or returns the raw submitted email/phone.
 */

/** Escape the five HTML-significant characters. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Normalise untrusted text for storage as PLAIN TEXT.
 *  - removes any HTML tag (including script/style bodies)
 *  - drops null bytes and other control characters
 *  - collapses runs of blank lines and trims
 * Length is capped by the caller.
 */
export function sanitizePlainText(input: unknown, maxLength = 5000): string {
  if (input == null) return '';
  let s = String(input);
  // Remove script/style blocks entirely (including their inner text).
  s = s.replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  // Remove every remaining tag.
  s = s.replace(/<[^>]*>/g, '');
  // Decode the most common entities so "&lt;script&gt;" cannot re-appear as a tag.
  s = s
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/gi, ' ');
  // Second pass: strip tags revealed by entity decoding.
  s = s.replace(/<[^>]*>/g, '');
  // Strip control characters (keep \n and \t).
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  // Collapse 3+ newlines and 3+ spaces.
  s = s.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{3,}/g, '  ');
  return s.trim().slice(0, maxLength);
}

/** Trim + cap a single-line field; returns null when empty. */
export function sanitizeLine(input: unknown, maxLength = 200): string | null {
  const s = sanitizePlainText(input, maxLength).replace(/\s*\n\s*/g, ' ').trim();
  return s ? s : null;
}

/** Basic email shape check (deliberately permissive — never a hard gate). */
export function looksLikeEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Loose phone check: at least 7 digits after stripping separators. */
export function looksLikePhone(value: string | null | undefined): boolean {
  if (!value) return false;
  return (value.replace(/[^\d]/g, '') ?? '').length >= 7;
}

/** Client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim().slice(0, 64);
  return (
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    headers.get('x-vercel-forwarded-for') ||
    'unknown'
  ).slice(0, 64);
}

/* ------------------------------------------------------------------ *
 * In-process rate limiter
 * ------------------------------------------------------------------ */

type Bucket = { hits: number[]; };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  /** Seconds until the caller may retry. */
  retryAfter: number;
  remaining: number;
};

/**
 * Sliding-window limiter. `key` should combine the bucket name and the client
 * identity, e.g. `comment:<ip>`.
 */
export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now;
    buckets.set(key, bucket);
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
      remaining: 0,
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.hits.every((t) => now - t > windowMs)) buckets.delete(k);
    }
  }

  return { ok: true, retryAfter: 0, remaining: limit - bucket.hits.length };
}

/* ------------------------------------------------------------------ *
 * Bot defences
 * ------------------------------------------------------------------ */

/** A filled honeypot field means the submitter is (almost certainly) a bot. */
export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Optional Google reCAPTCHA verification.
 * Returns `{ ok: true, skipped: true }` when no secret key is configured so the
 * feature is opt-in per environment.
 */
export async function verifyRecaptcha(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, error: 'recaptcha_missing' };

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    });
    const json = (await res.json().catch(() => ({}))) as { success?: boolean };
    return json.success ? { ok: true } : { ok: false, error: 'recaptcha_failed' };
  } catch {
    // Network hiccup must not block legitimate visitors.
    return { ok: true, skipped: true };
  }
}

/** Public (browser) reCAPTCHA site key — safe to expose; empty = disabled. */
export function recaptchaSiteKey(): string {
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
}

export function recaptchaEnabled(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY);
}
