/**
 * POST /api/enquiry — accepts Quick Enquiry, Contact, Quote forms.
 * Saves to the DB, optionally uploads photo/video, and returns a WhatsApp link.
 */
import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { data } from '@/lib/data';
import { getSetting } from '@/lib/settings';
import { buildWhatsAppLink } from '@/lib/formatters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;     // 8 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;    // 50 MB
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const ALLOWED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_VIDEO_EXT = new Set(['.mp4', '.mov', '.webm']);

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/** Save a file with random name and validate. Returns public URL. */
async function saveFile(file: File, kind: 'image' | 'video'): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = path.extname(file.name).toLowerCase();
  if (kind === 'image') {
    if (!ALLOWED_IMAGE_MIME.has(file.type) || !ALLOWED_IMAGE_EXT.has(ext)) return null;
    if (file.size > MAX_IMAGE_BYTES) return null;
  } else {
    if (!ALLOWED_VIDEO_MIME.has(file.type) || !ALLOWED_VIDEO_EXT.has(ext)) return null;
    if (file.size > MAX_VIDEO_BYTES) return null;
  }
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const dest = path.join(UPLOAD_DIR, safeName);
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return `/uploads/${safeName}`;
}

export async function POST(req: NextRequest) {
  try {
    // Accept both application/json and multipart/form-data.
    const ct = req.headers.get('content-type') || '';
    const fields: Record<string, string> = {};
    let photo: File | null = null;
    let video: File | null = null;

    if (ct.includes('application/json')) {
      const json = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      for (const [k, v] of Object.entries(json)) {
        fields[k] = v == null ? '' : typeof v === 'string' ? v : String(v);
      }
    } else {
      const form = await req.formData();
      for (const [k, v] of form.entries()) {
        if (v instanceof File) {
          if (k === 'photo') photo = v;
          else if (k === 'video') video = v;
        } else {
          fields[k] = v.toString();
        }
      }
    }

    const get = (k: string) => (fields[k] ?? '').trim();

    // Basic validation — never 500 on bad input.
    if (!get('name') && !get('message')) {
      return NextResponse.json({ ok: false, error: 'Name or message is required' }, { status: 400 });
    }

    const photoUrl = photo ? await saveFile(photo, 'image') : null;
    const videoUrl = video ? await saveFile(video, 'video') : null;

    const id = data.createEnquiry({
      type: get('type') || 'general',
      name: get('name') || null,
      phone: get('phone') || null,
      whatsapp: get('whatsapp') || null,
      email: get('email') || null,
      brand: get('brand') || null,
      model: get('model') || null,
      quantity: get('quantity') || null,
      message: get('message') || null,
      photo_url: photoUrl,
      video_url: videoUrl,
      product_id: null,
      source_page: req.headers.get('referer') ?? null,
    });

    // Build a WhatsApp link for the customer to send
    const whatsapp = getSetting('whatsapp_number', '60103838222');
    const lines = [
      `Hi ATORA, I just submitted a website enquiry (#${id}):`,
      ``,
    ];
    if (get('name')) lines.push(`Name: ${get('name')}`);
    if (get('phone')) lines.push(`Phone: ${get('phone')}`);
    if (get('brand')) lines.push(`Brand: ${get('brand')}`);
    if (get('model')) lines.push(`Model: ${get('model')}`);
    if (get('quantity')) lines.push(`Quantity: ${get('quantity')}`);
    if (get('message')) lines.push('', get('message'));
    const link = buildWhatsAppLink(whatsapp, lines.join('\n'));

    return NextResponse.json({ ok: true, id, whatsappLink: link });
  } catch (err) {
    console.error('[api/enquiry]', err);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
