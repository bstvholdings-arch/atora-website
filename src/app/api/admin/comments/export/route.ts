/**
 * GET /api/admin/comments/export?status=approved&q=...
 *
 * Streams the comment list as a UTF-8 CSV (Excel-friendly BOM included).
 * Requires an authenticated admin session. Includes the private contact fields
 * because this is the moderation export — never expose this URL publicly.
 */
import { NextRequest, NextResponse } from 'next/server';
import { data } from '@/lib/data';
import { requireAdmin } from '@/lib/apiGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** RFC 4180 CSV cell escaping + spreadsheet formula-injection guard. */
function cell(value: unknown): string {
  if (value == null) return '';
  let s = String(value);
  // Prevent a leading =, +, -, @ from being executed as a formula in Excel.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('response' in guard) return guard.response;
  const sp = req.nextUrl.searchParams;

  try {
    const comments = await data.listComments({
      status: sp.get('status') ?? 'all',
      q: sp.get('q') ?? undefined,
      limit: 5000,
    });

    const header = [
      'id', 'created_at', 'status', 'name', 'email', 'phone',
      'rating', 'language', 'page', 'award_id', 'message', 'ip', 'user_agent',
    ];
    const rows = comments.map((c) =>
      [
        c.id, c.created_at, c.status, c.name, c.email, c.phone,
        c.rating, c.language, c.page, c.award_id, c.message, c.ip, c.user_agent,
      ].map(cell).join(',')
    );

    const csv = `\uFEFF${header.join(',')}\n${rows.join('\n')}\n`;
    const stamp = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="atora-comments-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[api/admin/comments/export]', err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
