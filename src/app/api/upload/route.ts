/**
 * POST /api/upload — admin-only media upload. Used by product/partner/location pages.
 * Token auth via cookie (admin session).
 */
import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { getCurrentAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const ALLOWED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_VIDEO_EXT = new Set(['.mp4', '.mov', '.webm']);

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ct = req.headers.get('content-type') || '';
    if (!ct.includes('multipart/form-data')) {
      return NextResponse.json({ ok: false, error: 'Expected multipart/form-data' }, { status: 400 });
    }
    const form = await req.formData();
    const file = form.get('file');
    const kind = (form.get('kind')?.toString() ?? 'image') as 'image' | 'video';

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'No file' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (kind === 'image') {
      if (!ALLOWED_IMAGE_MIME.has(file.type) || !ALLOWED_IMAGE_EXT.has(ext)) {
        return NextResponse.json({ ok: false, error: 'Invalid image type' }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ ok: false, error: 'Image too large (max 8MB)' }, { status: 400 });
      }
    } else {
      if (!ALLOWED_VIDEO_MIME.has(file.type) || !ALLOWED_VIDEO_EXT.has(ext)) {
        return NextResponse.json({ ok: false, error: 'Invalid video type' }, { status: 400 });
      }
      if (file.size > MAX_VIDEO_BYTES) {
        return NextResponse.json({ ok: false, error: 'Video too large (max 50MB)' }, { status: 400 });
      }
    }

    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const dest = path.join(UPLOAD_DIR, safeName);
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(dest, buf);
    return NextResponse.json({ ok: true, url: `/uploads/${safeName}` });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
