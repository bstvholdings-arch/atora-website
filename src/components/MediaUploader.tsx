'use client';

import { useState } from 'react';

const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_VIDEO_EXT = ['mp4', 'mov', 'webm'];

export default function MediaUploader({
  kind = 'image',
  defaultUrl = '',
  name = 'url',
}: {
  kind?: 'image' | 'video';
  defaultUrl?: string;
  name?: string;
}) {
  const [url, setUrl] = useState(defaultUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (kind === 'image' && !ALLOWED_IMAGE_EXT.includes(ext)) {
      setError('Image must be JPG, PNG or WEBP');
      setUploading(false);
      return;
    }
    if (kind === 'video' && !ALLOWED_VIDEO_EXT.includes(ext)) {
      setError('Video must be MP4, MOV or WEBM');
      setUploading(false);
      return;
    }

    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.ok) {
        setUrl(data.url);
      } else {
        setError(data.error ?? 'Upload failed');
      }
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-start gap-3">
        {url ? (
          kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Preview" className="h-20 w-20 object-cover rounded-md border border-gray-200" />
          ) : (
            <video src={url} controls className="h-20 rounded-md border border-gray-200" />
          )
        ) : (
          <div className="h-20 w-20 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
            No file
          </div>
        )}
        <div className="flex-1">
          <input
            type="file"
            accept={kind === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/quicktime,video/webm'}
            onChange={upload}
            disabled={uploading}
            className="block w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            {kind === 'image' ? 'JPG/PNG/WEBP, max 8MB' : 'MP4/MOV/WEBM, max 50MB'}
            {url && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="ml-3 text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          {uploading && <p className="text-xs text-brand-600 mt-1">Uploading…</p>}
        </div>
      </div>
    </div>
  );
}
