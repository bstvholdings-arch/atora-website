/**
 * POST /api/upload — admin-only media upload. Used by product/partner/location pages.
 * Token auth via cookie (admin session).
 */
import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { getCurrentAdmin } from '@/lib/auth';
import { storageConfigured, uploadToStorage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const ALLOWED_PHOTO_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/jpg']);
const ALLOWED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_VIDEO_EXT = new Set(['.mp4', '.mov', '.webm']);
const ALLOWED_PHOTO_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif']);

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
    const kind = (form.get('kind')?.toString() ?? 'image') as 'image' | 'video' | 'photo';

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
    } else if (kind === 'photo') {
      // Product album / About gallery: JPG, PNG or GIF only, max 5MB.
      // (Client also validates — this is the second half of the 双重校验.)
      if (!ALLOWED_PHOTO_MIME.has(file.type) || !ALLOWED_PHOTO_EXT.has(ext)) {
        return NextResponse.json({ ok: false, error: 'Only JPG, PNG or GIF allowed' }, { status: 400 });
      }
      if (file.size > MAX_PHOTO_BYTES) {
        return NextResponse.json({ ok: false, error: 'Photo too large (max 5MB)' }, { status: 400 });
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
    const buf = Buffer.from(await file.arrayBuffer());

    // Production: object storage (Supabase Storage). Falls back to local
    // public/uploads when storage env is not configured (local dev).
    if (storageConfigured()) {
      const url = await uploadToStorage(
        `uploads/${safeName}`,
        buf,
        file.type || 'application/octet-stream',
      );
      if (url) return NextResponse.json({ ok: true, url });
    }

    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const dest = path.join(UPLOAD_DIR, safeName);
    fs.writeFileSync(dest, buf);
    return NextResponse.json({ ok: true, url: `/uploads/${safeName}` });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
