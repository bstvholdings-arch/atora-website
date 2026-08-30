/**
 * POST /api/product-images — admin-only product image upload.
 * Uploads to the dedicated `product-images` Supabase Storage bucket using the
 * SERVICE ROLE KEY server-side (never exposed to the client), returns a public URL.
 *
 * DELETE /api/product-images — admin-only delete.
 * Accepts a public Storage URL, parses it, and removes the object from Storage.
 * Used by the "New Product" modal's image picker to clean up removals.
 *
 * Auth is via the admin session cookie (getCurrentAdmin). The service-role key
 * lives only in this server process / environment — it is never sent to the browser.
 */
import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { getCurrentAdmin } from '@/lib/auth';
import {
  storageConfigured,
  uploadToProductImages,
  deleteFromStorage,
  parsePublicStorageUrl,
} from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!storageConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Storage is not configured (missing SUPABASE_SERVICE_ROLE_KEY).' },
      { status: 500 },
    );
  }

  try {
    const ct = req.headers.get('content-type') || '';
    if (!ct.includes('multipart/form-data')) {
      return NextResponse.json({ ok: false, error: 'Expected multipart/form-data' }, { status: 400 });
    }
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'No file' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_MIME.has(file.type) || !ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ ok: false, error: 'Only JPG, PNG or WEBP allowed' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: 'Image too large (max 8MB)' }, { status: 400 });
    }

    const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());

    const url = await uploadToProductImages(key, buf, file.type || 'image/jpeg');
    if (!url) {
      return NextResponse.json({ ok: false, error: 'Upload failed (storage returned no URL).' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { url?: unknown };
    const url = typeof body.url === 'string' ? body.url : '';
    if (!url) {
      return NextResponse.json({ ok: false, error: 'Missing url' }, { status: 400 });
    }

    const parsed = parsePublicStorageUrl(url);
    if (!parsed) {
      return NextResponse.json({ ok: false, error: 'Not a recognized storage URL' }, { status: 400 });
    }

    await deleteFromStorage(parsed.bucket, parsed.path);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
