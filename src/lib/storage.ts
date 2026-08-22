/**
 * Server-side upload to Supabase Storage (object storage) for production.
 *
 * Uses the Supabase Storage REST API directly via `fetch` so we don't need to
 * add `@supabase/supabase-js` as a dependency. The service-role key is server-only
 * and must NEVER be exposed to the client.
 *
 * Falls back to returning `null` when storage env is not configured, so local
 * dev (no SUPABASE_SERVICE_ROLE_KEY) keeps writing to local `public/uploads`.
 */
const BUCKET = process.env.SUPABASE_BUCKET || 'media';

export function storageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Upload a buffer to the configured public bucket.
 * @returns the public object URL, or `null` if storage is not configured.
 */
export async function uploadToStorage(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string | null> {
  const base = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key_ = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key_) return null;

  const endpoint = `${base}/storage/v1/object/${BUCKET}/${key}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key_}`,
      apikey: key_,
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

  return `${base}/storage/v1/object/public/${BUCKET}/${key}`;
}
