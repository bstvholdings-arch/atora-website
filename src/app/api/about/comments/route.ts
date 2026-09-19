/**
 * /api/about/comments
 *
 *  GET  ?status=approved&page=1&per_page=10&order=newest&lang=en
 *       Public feed of APPROVED comments only (email / phone / ip never exposed).
 *
 *  POST — visitor submission. Always stored with status = 'pending' so nothing
 *       appears on the site until an admin approves it.
 *
 * Anti-spam: honeypot field, per-IP rate limiting (burst + window), optional
 * Google reCAPTCHA, duplicate suppression, IP + user-agent recording.
 * All text is stripped to plain text before it is stored (XSS defence) and
 * escaped again on render.
 */
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { data } from '@/lib/data';
import { resolveLocale, type Locale } from '@/lib/i18n';
import {
  getClientIp,
  isHoneypotTripped,
  looksLikeEmail,
  looksLikePhone,
  rateLimit,
  sanitizeLine,
  sanitizePlainText,
  verifyRecaptcha,
} from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ------------------------------------------------------------------ GET */

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lang = resolveLocale(sp.get('lang'));
  const status = sp.get('status') ?? 'approved';
  const page = Math.max(Number(sp.get('page') ?? 1) || 1, 1);
  const perPage = Math.min(Math.max(Number(sp.get('per_page') ?? 10) || 10, 1), 50);
  const order = sp.get('order') === 'oldest' ? 'oldest' : 'newest';

  // Only approved comments are ever publicly readable.
  if (status !== 'approved') {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  try {
    const [comments, total] = await Promise.all([
      data.listApprovedComments({ page, perPage, order }),
      data.countApprovedComments(),
    ]);
    return NextResponse.json({
      ok: true,
      lang,
      page,
      per_page: perPage,
      order,
      total,
      total_pages: Math.max(1, Math.ceil(total / perPage)),
      comments: comments.map((c) => ({
        id: c.id,
        name: c.name,
        message: c.message,
        rating: c.rating,
        award_id: c.award_id,
        award_title:
          (lang === 'zh' ? c.award_title_zh : lang === 'bm' ? c.award_title_bm : c.award_title_en) ||
          c.award_title_en ||
          null,
        created_at: c.created_at,
      })),
    });
  } catch (err) {
    console.error('[api/about/comments GET]', err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}

/* ----------------------------------------------------------------- POST */

const MAX_NAME = 80;
const MAX_MESSAGE = 2000;

function fail(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

async function readBody(req: NextRequest): Promise<Record<string, string>> {
  const ct = req.headers.get('content-type') || '';
  const out: Record<string, string> = {};
  if (ct.includes('application/json')) {
    const json = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    for (const [k, v] of Object.entries(json)) out[k] = v == null ? '' : String(v);
    return out;
  }
  const form = await req.formData().catch(() => null);
  if (form) {
    for (const [k, v] of form.entries()) if (!(v instanceof File)) out[k] = v.toString();
  }
  return out;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const userAgent = (req.headers.get('user-agent') ?? '').slice(0, 300);

  let body: Record<string, string>;
  try {
    body = await readBody(req);
  } catch {
    return fail('invalid_input', 400, { field: 'body' });
  }

  const lang: Locale = resolveLocale(body.lang || req.nextUrl.searchParams.get('lang'));

  // 1) Honeypot — a hidden field real users never fill in.
  if (isHoneypotTripped(body.website) || isHoneypotTripped(body.honeypot)) {
    // Pretend everything is fine so bots do not learn anything.
    return NextResponse.json({ ok: true, status: 'pending', spam: true });
  }

  // 2) Rate limiting — burst then sliding window, both per IP.
  const burst = rateLimit(`comment:burst:${ip}`, 1, 30);
  if (!burst.ok) {
    return fail('rate_limited', 429, { retry_after: burst.retryAfter });
  }
  const windowLimit = rateLimit(`comment:window:${ip}`, 5, 1800);
  if (!windowLimit.ok) {
    return fail('rate_limited', 429, { retry_after: windowLimit.retryAfter });
  }

  // 3) Optional reCAPTCHA (skipped automatically when no secret key is set).
  const captchaToken = body.recaptchaToken || body['g-recaptcha-response'] || null;
  const captcha = await verifyRecaptcha(captchaToken, ip);
  if (!captcha.ok) return fail('recaptcha_failed', 400);

  // 4) Validate + sanitise.
  const name = sanitizeLine(body.name, MAX_NAME);
  const message = sanitizePlainText(body.message, MAX_MESSAGE);
  const email = sanitizeLine(body.email, 160);
  const phone = sanitizeLine(body.phone, 40);

  if (!name || name.length < 2) return fail('invalid_input', 400, { field: 'name' });
  if (!message || message.length < 5) return fail('invalid_input', 400, { field: 'message' });
  if (email && !looksLikeEmail(email)) return fail('invalid_input', 400, { field: 'email' });
  if (phone && !looksLikePhone(phone)) return fail('invalid_input', 400, { field: 'phone' });

  let rating: number | null = null;
  if (body.rating != null && String(body.rating).trim() !== '') {
    const n = Number(body.rating);
    if (!Number.isFinite(n) || n < 1 || n > 5) return fail('invalid_input', 400, { field: 'rating' });
    rating = Math.round(n);
  }

  // 5) Optional link to a published award.
  let awardId: number | null = null;
  if (body.award_id != null && String(body.award_id).trim() !== '') {
    const n = Number(body.award_id);
    if (Number.isFinite(n) && n > 0) {
      const award = await data.getAwardById(n);
      if (award && award.is_published === 1) awardId = award.id;
    }
  }

  try {
    // 6) Duplicate suppression — same IP + same text within 10 minutes.
    //    Best-effort only: a failure here must never block a real submission.
    let dupeId: number | undefined;
    try {
      const dupe = (await db
        .prepare(
          `SELECT id FROM comments
           WHERE ip = ? AND message = ? AND created_at > CURRENT_TIMESTAMP - INTERVAL '10 minutes'
           LIMIT 1`
        )
        .get(ip, message)) as { id: number } | undefined;
      dupeId = dupe?.id;
    } catch {
      dupeId = undefined;
    }
    if (dupeId) return NextResponse.json({ ok: true, id: dupeId, status: 'pending', duplicate: true });

    const id = await data.createComment({
      name,
      email,
      phone,
      message,
      rating,
      language: lang,
      page: sanitizeLine(body.page, 120) ?? 'about',
      award_id: awardId,
      ip,
      user_agent: userAgent,
      status: 'pending',
    });

    return NextResponse.json({ ok: true, id, status: 'pending' }, { status: 201 });
  } catch (err) {
    console.error('[api/about/comments POST]', err);
    return fail('server_error', 500);
  }
}
