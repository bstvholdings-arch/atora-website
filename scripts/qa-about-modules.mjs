/**
 * QA — About Us modules (awards / photo wall / comment board).
 *
 * End-to-end acceptance test against a running production server:
 *   1. admin can create an award with tri-lingual text + upload medal images
 *   2. the public About page + award detail page render it (per language)
 *   3. gallery photos can be uploaded, ordered and appear on About Us
 *   4. a visitor can submit a comment; it stays hidden until approved
 *   5. only approved comments are public, and email/phone never leak
 *   6. the CSV export works, then all test data is removed
 *
 * Usage:
 *   npm run build && npm run start          # in one terminal
 *   node scripts/qa-about-modules.mjs       # in another
 *
 * Requires DATABASE_URL (read from .env by pg-helper).
 */
import crypto from 'node:crypto';
import db from './pg-helper.mjs';

const BASE = process.env.QA_BASE_URL || 'http://localhost:3000';
const SLUG = `qa-award-${Date.now()}`;

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  \u2713 ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`  \u2717 ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html or csv */
  }
  return { status: res.status, text, json, headers: res.headers };
}

async function mintSession() {
  const admin = await db.prepare('SELECT id, email, role FROM admin_users ORDER BY id LIMIT 1').get();
  if (!admin) throw new Error('No admin user in the database — run `npm run admin:create`.');
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
  await db.prepare('INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, ?)').run(token, admin.id, expiresAt);
  return { token, adminId: admin.id };
}

const created = { awards: [], gallery: [], comments: [] };

/** Row counts before the run, so cleanup can be verified without assuming an empty DB. */
const baseline = {};

async function snapshotCounts() {
  for (const t of ['awards', 'award_media', 'gallery', 'comments']) {
    const r = await db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get();
    baseline[t] = Number(r.c);
  }
}

async function main() {
  console.log(`\nQA — About Us modules @ ${BASE}\n`);
  await snapshotCounts();
  console.log(`  baseline rows: ${Object.entries(baseline).map(([k, v]) => `${k}=${v}`).join(', ')}`);

  /* ---------------------------------------------------------- 0. session */
  console.log('[0] Admin session');
  const { token, adminId } = await mintSession();
  const auth = { Cookie: `atora_admin=${token}`, 'Content-Type': 'application/json' };
  check('minted an admin session', !!token);

  /* ------------------------------------------------------- 1. awards CRUD */
  console.log('\n[1] Awards — create with tri-lingual fields');
  const createAward = await req('/api/admin/awards', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      slug: SLUG,
      year: '2025',
      title_en: 'QA Award EN',
      title_bm: 'QA Award BM',
      title_zh: 'QA 奖项 中文',
      issuer_en: 'QA Issuer EN',
      issuer_bm: 'QA Issuer BM',
      issuer_zh: 'QA 颁发机构',
      summary_en: 'QA summary EN.',
      summary_bm: 'QA ringkasan BM.',
      summary_zh: 'QA 简述。',
      story_en: 'QA story EN.',
      story_bm: 'QA kisah BM.',
      story_zh: 'QA 完整拿奖故事。',
      seo_title_en: 'QA SEO Title EN',
      seo_desc_en: 'QA SEO description EN.',
      is_published: '1',
    }),
  });
  check('POST /api/admin/awards → 201', createAward.status === 201, `got ${createAward.status}`);
  const awardId = createAward.json?.id;
  if (awardId) created.awards.push(awardId);
  check('award slug assigned', createAward.json?.slug === SLUG, createAward.json?.slug);

  if (awardId) {
    console.log('\n[2] Awards — medal images + cover');
    const addMedia = await req(`/api/admin/awards/${awardId}/media`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        items: [
          { file_path: 'https://example.invalid/medal-1.jpg', thumb_path: 'https://example.invalid/medal-1-t.jpg' },
          { file_path: 'https://example.invalid/medal-2.jpg', thumb_path: 'https://example.invalid/medal-2-t.jpg' },
        ],
      }),
    });
    check('POST award media → 201', addMedia.status === 201, `added ${addMedia.json?.added}`);
    check('first image auto-set as cover', addMedia.json?.media?.[0]?.is_cover === 1);

    const update = await req(`/api/admin/awards/${awardId}`, {
      method: 'PUT',
      headers: auth,
      body: JSON.stringify({ title_zh: 'QA 奖项 中文（已更新）' }),
    });
    check('PUT award → 200 (partial update)', update.status === 200);

    const publicEn = await req(`/api/about/awards/${SLUG}?lang=en`);
    check('GET /api/about/awards/{slug}?lang=en → 200', publicEn.status === 200);
    check('EN title served', publicEn.json?.award?.title === 'QA Award EN');
    check('cover synced onto the award', !!publicEn.json?.award?.cover_image, publicEn.json?.award?.cover_image);
    check('media count = 2', publicEn.json?.award?.media?.length === 2);

    const publicZh = await req(`/api/about/awards/${SLUG}?lang=zh`);
    check('ZH title served', publicZh.json?.award?.title === 'QA 奖项 中文（已更新）', publicZh.json?.award?.title);
    const publicBm = await req(`/api/about/awards/${SLUG}?lang=bm`);
    check('BM title served', publicBm.json?.award?.title === 'QA Award BM');

    const list = await req('/api/about/awards?lang=zh');
    check('award appears in the public list', (list.json?.awards ?? []).some((a) => a.slug === SLUG));

    const pageEn = await req(`/en/about/awards/${SLUG}`);
    const pageZh = await req(`/zh/about/awards/${SLUG}`);
    const pageBm = await req(`/bm/about/awards/${SLUG}`);
    check('award detail page 200 (en/bm/zh)', [pageEn, pageZh, pageBm].every((r) => r.status === 200));
    check('detail page has canonical', /rel="canonical"/.test(pageEn.text));
    check('detail page has hreflang alternates', (pageEn.text.match(/hreflang|hrefLang/g) ?? []).length >= 4);
    check('detail page emits CreativeWork JSON-LD', pageEn.text.includes('"CreativeWork"'));
    check('detail page emits BreadcrumbList JSON-LD', pageEn.text.includes('"BreadcrumbList"'));
    check('ZH story rendered on the detail page', pageZh.text.includes('QA 完整拿奖故事'));

    const aboutZh = await req('/zh/about');
    check('About page renders the award (ZH)', aboutZh.text.includes('QA 奖项 中文（已更新）'));
    check('About page has the awards anchor', aboutZh.text.includes('id="awards"'));
    check('About page emits ItemList JSON-LD', aboutZh.text.includes('"ItemList"'));

    const sitemap = await req('/sitemap.xml');
    check('sitemap includes the award URL', sitemap.text.includes(`/about/awards/${SLUG}`));
  }

  /* ------------------------------------------------------ 3. gallery CRUD */
  console.log('\n[3] Photo wall — upload, order, publish');
  const addGallery = await req('/api/admin/gallery', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      items: [
        {
          file_path: 'https://example.invalid/g1.jpg',
          thumb_path: 'https://example.invalid/g1-t.jpg',
          title_en: 'QA Photo EN',
          title_zh: 'QA 照片 中文',
          alt_zh: 'QA 照片替代文字',
          year: '2025',
          event_name: 'QA Event',
        },
        { file_path: 'https://example.invalid/g2.jpg', title_en: 'QA Photo 2' },
      ],
    }),
  });
  check('POST /api/admin/gallery → 201', addGallery.status === 201, `added ${addGallery.json?.added}`);

  const adminGallery = await req('/api/admin/gallery', { headers: auth });
  const gIds = (adminGallery.json?.photos ?? []).map((p) => p.id);
  created.gallery.push(...gIds);
  check('admin gallery lists both photos', gIds.length === 2);
  check('first photo auto-set as cover', (adminGallery.json?.photos ?? [])[0]?.is_cover === 1);

  if (gIds.length === 2) {
    const reorder = await req('/api/admin/gallery', {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ order: [gIds[1], gIds[0]] }),
    });
    check('PATCH gallery order → 200', reorder.status === 200);
    // The cover is intentionally pinned first in the list, so assert on the
    // persisted sort_order values instead of the returned row order.
    const rows = await db.prepare('SELECT id, sort_order FROM gallery WHERE id IN (?, ?)').all(gIds[0], gIds[1]);
    const sortOf = (id) => Number(rows.find((r) => r.id === id)?.sort_order ?? 0);
    check('sort_order persisted', sortOf(gIds[1]) < sortOf(gIds[0]), `${sortOf(gIds[1])} < ${sortOf(gIds[0])}`);
    const after = await req('/api/admin/gallery', { headers: auth });
    check('cover still listed first', after.json?.photos?.[0]?.is_cover === 1);
  }

  const pubGallery = await req('/api/about/gallery?lang=zh');
  check('GET /api/about/gallery → 200', pubGallery.status === 200);
  const zhPhoto = (pubGallery.json?.photos ?? []).find((p) => p.title === 'QA 照片 中文');
  check('ZH title + alt served', !!zhPhoto && zhPhoto.alt === 'QA 照片替代文字');
  const aboutGallery = await req('/zh/about');
  check('About page renders the photo wall', aboutGallery.text.includes('QA 照片 中文'));
  check('About page has the gallery anchor', aboutGallery.text.includes('id="gallery"'));

  /* ----------------------------------------------------- 4. comment flow */
  console.log('\n[4] Comment board — submit, moderate, publish');
  const submit = await req('/api/about/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'QA Visitor',
      email: 'qa.visitor@example.invalid',
      phone: '0123456789',
      message: 'QA message body <script>alert(1)</script>',
      rating: 5,
      lang: 'en',
      page: 'about',
    }),
  });
  check('POST /api/about/comments → 201', submit.status === 201, `status=${submit.json?.status}`);
  check('comment stored as pending', submit.json?.status === 'pending');
  const commentId = submit.json?.id;
  if (commentId) created.comments.push(commentId);

  const stored = commentId
    ? await db.prepare('SELECT message, status, ip, user_agent FROM comments WHERE id = ?').get(commentId)
    : null;
  check('script tag stripped from stored message (XSS)', !!stored && !stored.message.includes('<script'), stored?.message);
  check('IP + user agent recorded', !!stored?.ip);

  const beforeApprove = await req('/api/about/comments?status=approved');
  check('pending comment NOT in the public feed', !beforeApprove.text.includes('QA message body'));

  const honeypot = await req('/api/about/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bot', message: 'buy now', website: 'http://spam.invalid' }),
  });
  check('honeypot submission silently accepted', honeypot.status === 200 && honeypot.json?.spam === true);

  const forbidden = await req('/api/about/comments?status=pending');
  check('public API refuses non-approved status (403)', forbidden.status === 403);

  const unauthApprove = await req(`/api/admin/comments/${commentId}/approve`, { method: 'PATCH' });
  check('approve requires auth (401)', unauthApprove.status === 401);

  const approve = await req(`/api/admin/comments/${commentId}/approve`, { method: 'PATCH', headers: auth });
  check('PATCH approve → 200', approve.status === 200);

  const afterApprove = await req('/api/about/comments?status=approved');
  check('approved comment is public', afterApprove.text.includes('QA message body'));
  check('email never exposed publicly', !afterApprove.text.includes('qa.visitor@example.invalid'));
  check('phone never exposed publicly', !afterApprove.text.includes('0123456789'));

  const aboutComments = await req('/en/about');
  check('About page renders the approved comment', aboutComments.text.includes('QA message body'));
  check('About page has the comments anchor', aboutComments.text.includes('id="comments"'));

  const csv = await req('/api/admin/comments/export?status=all', { headers: { Cookie: `atora_admin=${token}` } });
  check('CSV export → 200', csv.status === 200);
  check('CSV includes the comment', csv.text.includes('QA Visitor'));
  // `Response.text()` strips the BOM, so inspect the raw bytes for EF BB BF.
  const csvRaw = new Uint8Array(
    await (await fetch(`${BASE}/api/admin/comments/export?status=all`, {
      headers: { Cookie: `atora_admin=${token}` },
    })).arrayBuffer()
  );
  check(
    'CSV starts with a UTF-8 BOM (Excel-safe)',
    csvRaw[0] === 0xef && csvRaw[1] === 0xbb && csvRaw[2] === 0xbf,
    [...csvRaw.slice(0, 3)].map((b) => b.toString(16)).join(' ')
  );
  check(
    'CSV header row present',
    csv.text.replace(/^\uFEFF/, '').startsWith('id,created_at,status,name'),
    csv.text.slice(0, 24)
  );
  check(
    'CSV escapes the header correctly',
    (await req('/api/admin/comments/export?status=all', { headers: { Cookie: `atora_admin=${token}` } })).headers
      .get('content-disposition')
      ?.includes('attachment') === true
  );

  const csvUnauth = await req('/api/admin/comments/export');
  check('CSV export requires auth (401)', csvUnauth.status === 401);

  const spam = await req(`/api/admin/comments/${commentId}`, { method: 'DELETE', headers: auth });
  check('DELETE comment → 200', spam.status === 200);
  created.comments = [];

  /* ------------------------------------------------------ 5. i18n + SEO */
  console.log('\n[5] i18n + SEO on the About page');
  for (const [lang, marker] of [['en', 'Awards &amp; Medals'], ['bm', 'Anugerah &amp; Pingat'], ['zh', '奖项与奖牌']]) {
    const page = await req(`/${lang}/about`);
    check(`/${lang}/about renders the awards block`, page.text.includes(marker));
    check(`/${lang}/about has a canonical`, /rel="canonical"/.test(page.text));
    check(`/${lang}/about has 4 hreflang alternates`, (page.text.match(/hreflang|hrefLang/g) ?? []).length >= 4);
    check(`/${lang}/about has a meta description`, /name="description"/.test(page.text));
  }
  const zhAbout = await req('/zh/about');
  check('ZH UI strings present (留言板)', zhAbout.text.includes('留言板'));
  check('ZH UI strings present (活动照片)', zhAbout.text.includes('活动照片'));
  const enAbout = await req('/en/about');
  check('EN UI strings present (Leave a Message)', enAbout.text.includes('Leave a Message'));
  check('honeypot field present in the form', enAbout.text.includes('cm-website'));

  /* ------------------------------------------------------- 6. permissions */
  console.log('\n[6] Permissions');
  for (const p of ['/api/admin/awards', '/api/admin/gallery', '/api/admin/comments']) {
    const r = await req(p);
    check(`${p} requires auth (401)`, r.status === 401);
  }

  /* ----------------------------------------------------------- 7. cleanup */
  console.log('\n[7] Cleanup (no test data left behind)');
  for (const id of created.awards) {
    await req(`/api/admin/awards/${id}`, { method: 'DELETE', headers: auth });
  }
  for (const id of created.gallery) {
    await req(`/api/admin/gallery/${id}`, { method: 'DELETE', headers: auth });
  }
  for (const id of created.comments) {
    await req(`/api/admin/comments/${id}`, { method: 'DELETE', headers: auth });
  }
  await db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  await db.prepare('DELETE FROM comments WHERE message LIKE ?').run('QA message body%');

  for (const table of ['awards', 'award_media', 'gallery', 'comments']) {
    const r = await db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get();
    check(
      `${table} restored to the baseline (${baseline[table]} rows)`,
      Number(r.c) === baseline[table],
      `${r.c} rows`
    );
  }

  /* ------------------------------------------------------------ summary */
  console.log(`\n${'='.repeat(58)}`);
  console.log(`  PASSED ${pass}   FAILED ${fail}`);
  if (fail) console.log(`  Failures:\n    - ${failures.join('\n    - ')}`);
  console.log(`${'='.repeat(58)}\n`);
  return fail === 0 ? 0 : 1;
}

try {
  const code = await main();
  await db.close();
  process.exit(code);
} catch (err) {
  console.error('\nQA ABORTED:', err?.message ?? err);
  await db.close().catch(() => {});
  process.exit(1);
}
