/**
 * Client-side image compression + thumbnail generation.
 *
 * Runs entirely in the browser (canvas API) so the serverless functions never
 * have to ship a native image library, and so uploads stay small on mobile data.
 *
 *  - `compressImage()`  → a downscaled, re-encoded copy (WebP when supported,
 *                          JPEG otherwise) used as the full-size display image.
 *  - `makeThumbnail()`  → a small square-ish preview used by grids / the wall.
 *  - `prepareImage()`   → convenience wrapper returning both.
 *
 * Every function falls back to the original file when the browser cannot decode
 * it, so an exotic format never blocks an upload.
 */

export type CompressOptions = {
  /** Longest edge of the output, in pixels. */
  maxSize?: number;
  /** 0–1 encoder quality. */
  quality?: number;
  /** Preferred output mime type; WebP falls back to JPEG automatically. */
  mimeType?: 'image/webp' | 'image/jpeg';
};

const DEFAULTS: Required<CompressOptions> = {
  maxSize: 1920,
  quality: 0.82,
  mimeType: 'image/webp',
};

/** Does the browser actually encode this mime type? (Safari < 14 says no.) */
let webpSupport: boolean | null = null;
function supportsWebp(): boolean {
  if (webpSupport !== null) return webpSupport;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

function targetMime(preferred?: string): string {
  if (preferred === 'image/jpeg') return 'image/jpeg';
  if (preferred === 'image/webp') return supportsWebp() ? 'image/webp' : 'image/jpeg';
  return supportsWebp() ? 'image/webp' : 'image/jpeg';
}

function extensionFor(mime: string): string {
  return mime === 'image/webp' ? 'webp' : 'jpg';
}

/** Load a File into an HTMLImageElement (works without createImageBitmap). */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode_failed'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

/** Draw `img` scaled so its longest edge is at most `maxSize`. */
function drawScaled(img: HTMLImageElement, maxSize: number): HTMLCanvasElement {
  const { naturalWidth: w, naturalHeight: h } = img;
  const scale = Math.min(1, maxSize / Math.max(w || 1, h || 1));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((w || maxSize) * scale));
  canvas.height = Math.max(1, Math.round((h || maxSize) * scale));
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

/** Rename "photo.JPG" → "photo.webp" so the extension matches the encoder. */
function renameTo(file: File, mime: string): string {
  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.${extensionFor(mime)}`;
}

/**
 * Downscale + re-encode an image. Returns the ORIGINAL file when compression
 * would not help (already small / unsupported format).
 */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const { maxSize, quality, mimeType } = { ...DEFAULTS, ...options };
  const mime = targetMime(mimeType);

  // SVG / GIF (possibly animated) are passed through untouched.
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  try {
    const img = await loadImage(file);
    const canvas = drawScaled(img, maxSize);
    const blob = await canvasToBlob(canvas, mime, quality);
    if (!blob) return file;

    // Keep the original when re-encoding produced something bigger.
    if (blob.size >= file.size && file.size > 0) {
      const originalIsSmallEnough = Math.max(img.naturalWidth, img.naturalHeight) <= maxSize;
      if (originalIsSmallEnough) return file;
    }

    return new File([blob], renameTo(file, mime), { type: mime, lastModified: Date.now() });
  } catch {
    return file;
  }
}

/** Small preview (default 480px longest edge) for grids and the photo wall. */
export async function makeThumbnail(file: File, maxSize = 480, quality = 0.72): Promise<File> {
  return compressImage(file, { maxSize, quality, mimeType: 'image/webp' });
}

export type PreparedImage = {
  /** Full-size (compressed) image. */
  full: File;
  /** Thumbnail generated from the same source. */
  thumb: File;
  /** Original file size in bytes, for the "saved X%" hint. */
  originalSize: number;
};

/** Compress + thumbnail in one call. */
export async function prepareImage(file: File, options: CompressOptions = {}): Promise<PreparedImage> {
  const full = await compressImage(file, options);
  const thumb = await makeThumbnail(full);
  return { full, thumb, originalSize: file.size };
}

/** Human-readable "1.2 MB". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Upload a prepared image to /api/upload and return the stored URLs.
 * `kind: 'photo'` is the About-gallery / awards bucket (JPG, PNG, GIF, WEBP).
 */
export async function uploadImage(
  file: File,
  kind: 'photo' | 'image' = 'photo'
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('kind', kind);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
    if (!res.ok || !data.ok || !data.url) {
      return { ok: false, error: data.error || `Upload failed (${res.status})` };
    }
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, error: 'Upload failed. Please check your connection and try again.' };
  }
}

/** Compress → thumbnail → upload both. Returns the two public URLs. */
export async function uploadImagePair(
  file: File,
  options: CompressOptions = {}
): Promise<{ ok: true; file_path: string; thumb_path: string } | { ok: false; error: string }> {
  const { full, thumb } = await prepareImage(file, options);

  const fullRes = await uploadImage(full);
  if (!fullRes.ok) return { ok: false, error: fullRes.error };

  const thumbRes = await uploadImage(thumb);
  // A missing thumbnail must never block the upload — fall back to the full image.
  return {
    ok: true,
    file_path: fullRes.url,
    thumb_path: thumbRes.ok ? thumbRes.url : fullRes.url,
  };
}
