/**
 * Server-side upload to Supabase Storage (object storage) for production.
 *
 * Uses the Supabase Storage REST API directly via `fetch` so we don't need to
 * add `@supabase/supabase-js` as a dependency. The service-role key is server-only
 * and must NEVER be exposed to the client.
 *
 * Falls back to returning `null` when storage env is not configured, so local
 * dev (no SUPABASE_SERVICE_ROLE_KEY) keeps writing to local `public/uploads`.
 *
 * Buckets are created on demand (idempotently, as public) the first time we
 * upload to them, so there is no separate "create bucket" step to run.
 */
const MEDIA_BUCKET = process.env.SUPABASE_BUCKET || 'media';
const PRODUCT_IMAGES_BUCKET = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET || 'product-images';

export function storageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Memoised per-bucket "ensure exists" promises (one network call per process). */
const bucketReady = new Map<string, Promise<void>>();

async function ensureBucket(base: string, svc: string, bucket: string): Promise<void> {
  let p = bucketReady.get(bucket);
  if (!p) {
    p = (async () => {
      const res = await fetch(`${base}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${svc}`,
          apikey: svc,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: bucket, public: true }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        const msg = (body?.message || body?.error || '').toString();
        // Bucket already exists → fine; leave its existing config as-is.
        if (res.status === 409 || /already exists/i.test(msg)) return;
        console.warn(`[storage] ensure bucket "${bucket}" returned ${res.status}: ${msg}`);
      }
    })().catch((e) => {
      bucketReady.delete(bucket); // allow a retry on the next upload
      console.warn('[storage] ensure bucket failed:', e);
    });
    bucketReady.set(bucket, p);
  }
  return p;
}

async function uploadToBucket(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string | null> {
  const base = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !svc) return null;

  await ensureBucket(base, svc, bucket);

  const endpoint = `${base}/storage/v1/object/${bucket}/${key}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${svc}`,
      apikey: svc,
      'Content-Type': contentType,
      'x-upsert': 'true',
      'Cache-Control': 'max-age=3600',
    },
    body,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Supabase Storage upload failed (${res.status}): ${txt.slice(0, 300)}`);
  }

  return `${base}/storage/v1/object/public/${bucket}/${key}`;
}

/** Upload to the generic media bucket (used by /api/upload — photos, video posters, etc.). */
export async function uploadToStorage(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string | null> {
  return uploadToBucket(MEDIA_BUCKET, key, body, contentType);
}

/** Upload a product image to the dedicated `product-images` bucket. */
export async function uploadToProductImages(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string | null> {
  return uploadToBucket(PRODUCT_IMAGES_BUCKET, key, body, contentType);
}

/** Delete an object from any bucket. `path` is the part after the bucket name. */
export async function deleteFromStorage(bucket: string, path: string): Promise<void> {
  const base = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !svc) return;
  const endpoint = `${base}/storage/v1/object/${bucket}/${path}`;
  const res = await fetch(endpoint, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${svc}`, apikey: svc },
  });
  // 404 = already gone; treat as success.
  if (!res.ok && res.status !== 404) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Supabase Storage delete failed (${res.status}): ${txt.slice(0, 300)}`);
  }
}

/** Parse a Supabase public object URL into { bucket, path }. Returns null if not a Supabase public URL. */
export function parsePublicStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!m) return null;
    return { bucket: m[1], path: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
}
