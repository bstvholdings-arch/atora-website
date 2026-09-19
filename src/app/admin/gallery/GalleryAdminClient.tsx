'use client';

/**
 * GalleryAdminClient — 相册管理 (Photo wall / album).
 *
 * Multi-image upload with automatic compression + thumbnail generation,
 * drag-and-drop ordering, cover selection, per-language title / caption / alt,
 * shoot year & event name, publish toggle and delete.
 */
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GalleryItem } from '@/lib/db';
import {
  addGalleryAction,
  deleteGalleryAction,
  listGalleryAction,
  reorderGalleryAction,
  setGalleryCoverAction,
  updateGalleryAction,
} from '@/lib/actions';
import { formatBytes, prepareImage, uploadImage } from '@/lib/imageCompress';
import { validatePhotoFile } from '../products/ProductAlbumManager';

const LANGS = [
  { key: 'en', label: 'EN' },
  { key: 'bm', label: 'BM' },
  { key: 'zh', label: '中文' },
] as const;
type Lang = (typeof LANGS)[number]['key'];

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

export default function GalleryAdminClient({ initialPhotos }: { initialPhotos: GalleryItem[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<GalleryItem[]>(initialPhotos);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [eventName, setEventName] = useState('');
  const [shootYear, setShootYear] = useState('');

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  async function reload() {
    setPhotos(await listGalleryAction());
  }

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setNotice(null);

    const files = Array.from(fileList);
    const problems = files.map((f) => validatePhotoFile(f, MAX_SOURCE_BYTES)).filter(Boolean) as string[];
    if (problems.length > 0) {
      setError(problems.join(' · '));
      return;
    }

    setBusy(true);
    let savedBytes = 0;
    try {
      const uploaded: { file_path: string; thumb_path: string | null; event_name: string | null; year: string | null }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Compressing ${i + 1}/${files.length} — ${file.name}`);
        const { full, thumb } = await prepareImage(file);
        savedBytes += Math.max(0, file.size - full.size);

        const fullRes = await uploadImage(full);
        if (!fullRes.ok) {
          setError(`${file.name}: ${fullRes.error}`);
          break;
        }
        const thumbRes = await uploadImage(thumb);
        uploaded.push({
          file_path: fullRes.url,
          thumb_path: thumbRes.ok ? thumbRes.url : fullRes.url,
          event_name: eventName.trim() || null,
          year: shootYear.trim() || null,
        });
        setProgress(`Uploaded ${i + 1}/${files.length}`);
      }

      if (uploaded.length > 0) {
        const res = await addGalleryAction(uploaded);
        if (!res.ok) setError(res.error ?? 'Failed to save photos.');
        else {
          await reload();
          router.refresh();
          setNotice(
            `${res.added ?? uploaded.length} photo(s) added${
              savedBytes > 0 ? ` · compressed, saved ≈ ${formatBytes(savedBytes)}` : ''
            }. Fill in the tri-lingual titles below.`
          );
        }
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setBusy(false);
      setProgress(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function persistOrder(next: GalleryItem[]) {
    setBusy(true);
    try {
      const res = await reorderGalleryAction(next.map((p) => p.id));
      if (!res.ok) setError(res.error ?? 'Failed to reorder.');
      else {
        await reload();
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setPhotos(next);
    void persistOrder(next);
  }

  function onDrop(targetId: number) {
    if (dragId === null || dragId === targetId) return;
    const from = photos.findIndex((p) => p.id === dragId);
    const to = photos.findIndex((p) => p.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null);
    setOverId(null);
    setPhotos(next);
    void persistOrder(next);
  }

  async function onDelete(p: GalleryItem) {
    if (!window.confirm('Delete this photo? This cannot be undone.')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await deleteGalleryAction(p.id);
      if (!res.ok) setError(res.error ?? 'Failed to delete.');
      else {
        await reload();
        router.refresh();
        setNotice('Photo deleted.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSetCover(p: GalleryItem) {
    setBusy(true);
    try {
      const res = await setGalleryCoverAction(p.id);
      if (!res.ok) setError(res.error ?? 'Failed to set cover.');
      else {
        await reload();
        router.refresh();
        setNotice('Cover updated.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="heading-1">Gallery · 相册管理</h1>
        <p className="text-sm text-gray-500">
          Activity &amp; award photos shown on the About Us page. Images are compressed automatically and a thumbnail is
          generated for the wall. Every photo has EN / BM / 中文 title, caption and alt text.
        </p>
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</p>}
      {notice && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">{notice}</p>}
      {progress && <p className="text-xs text-brand-700">{progress}</p>}

      <div className="card p-4">
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Event name (optional, applies to the next upload)</label>
            <input
              className="input"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. ATORA Annual Dealer Night 2025"
            />
          </div>
          <div>
            <label className="label">Shoot year (optional)</label>
            <input
              className="input"
              value={shootYear}
              onChange={(e) => setShootYear(e.target.value)}
              placeholder="2025"
            />
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
          multiple
          disabled={busy}
          onChange={(e) => uploadFiles(e.target.files)}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-600 file:text-white hover:file:bg-brand-700 disabled:opacity-50"
        />
        <p className="text-[11px] text-gray-500 mt-2">
          JPG / PNG / WEBP / GIF · up to {MAX_SOURCE_BYTES / 1024 / 1024}MB each (compressed before upload) · drag the
          cards to reorder, or use ↑ ↓. {photos.length} photo(s) in the album.
        </p>
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-gray-500">No photos yet. Upload one to get started.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((p, i) => (
            <div
              key={p.id}
              draggable={!busy}
              onDragStart={() => setDragId(p.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(p.id);
              }}
              onDragLeave={() => setOverId((cur) => (cur === p.id ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(p.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={`border rounded-md bg-white p-2 flex flex-col cursor-move transition ${
                overId === p.id ? 'border-brand-500 ring-2 ring-brand-200' : 'border-gray-200'
              }`}
            >
              <div className="h-28 bg-gray-100 rounded overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumb_path ?? p.file_path}
                  alt={p.alt_en ?? ''}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-[11px] font-medium text-gray-800 truncate">
                  {p.title_en || p.event_name || '(untitled)'}
                </p>
                <div className="flex flex-wrap gap-1">
                  <span className={p.is_cover ? 'badge-green' : 'badge-gray'}>{p.is_cover ? 'Cover' : `#${i + 1}`}</span>
                  <span className={p.is_published === 1 ? 'badge-green' : 'badge-yellow'}>
                    {p.is_published === 1 ? 'Live' : 'Hidden'}
                  </span>
                </div>
                <div className="flex gap-1 text-[10px]">
                  <span className={p.title_bm ? 'badge-green' : 'badge-gray'}>BM</span>
                  <span className={p.title_zh ? 'badge-green' : 'badge-gray'}>中文</span>
                  {p.year && <span className="badge-gray">{p.year}</span>}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <button type="button" disabled={busy} onClick={() => setEditing(p)} className="text-brand-600 hover:text-brand-700 disabled:opacity-40">
                  Edit
                </button>
                {p.is_cover !== 1 && (
                  <button type="button" disabled={busy} onClick={() => onSetCover(p)} className="text-brand-600 hover:text-brand-700 disabled:opacity-40">
                    Cover
                  </button>
                )}
                <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} className="text-gray-600 hover:text-gray-900 disabled:opacity-30" title="Move up">↑</button>
                <button type="button" disabled={busy || i === photos.length - 1} onClick={() => move(i, 1)} className="text-gray-600 hover:text-gray-900 disabled:opacity-30" title="Move down">↓</button>
                <button type="button" disabled={busy} onClick={() => onDelete(p)} className="text-red-600 hover:text-red-700 disabled:opacity-40">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <GalleryEditModal
          photo={editing}
          onClose={() => setEditing(null)}
          onSaved={async (msg) => {
            setEditing(null);
            setNotice(msg);
            await reload();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function GalleryEditModal({
  photo,
  onClose,
  onSaved,
}: {
  photo: GalleryItem;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [lang, setLang] = useState<Lang>('en');
  const [titles, setTitles] = useState<Record<Lang, string>>({
    en: photo.title_en ?? '',
    bm: photo.title_bm ?? '',
    zh: photo.title_zh ?? '',
  });
  const [captions, setCaptions] = useState<Record<Lang, string>>({
    en: photo.caption_en ?? '',
    bm: photo.caption_bm ?? '',
    zh: photo.caption_zh ?? '',
  });
  const [alts, setAlts] = useState<Record<Lang, string>>({
    en: photo.alt_en ?? '',
    bm: photo.alt_bm ?? '',
    zh: photo.alt_zh ?? '',
  });
  const [year, setYear] = useState(photo.year ?? '');
  const [eventName, setEventName] = useState(photo.event_name ?? '');
  const [published, setPublished] = useState(photo.is_published === 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      for (const l of ['en', 'bm', 'zh'] as Lang[]) {
        fd.set(`title_${l}`, titles[l]);
        fd.set(`caption_${l}`, captions[l]);
        fd.set(`alt_${l}`, alts[l]);
      }
      fd.set('year', year);
      fd.set('event_name', eventName);
      fd.set('is_published', published ? '1' : 'off');
      const res = await updateGalleryAction(photo.id, fd);
      if (!res.ok) {
        setError(res.error ?? 'Save failed.');
        return;
      }
      onSaved('Photo updated.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl my-6 p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumb_path ?? photo.file_path}
              alt=""
              className="h-14 w-14 rounded border border-gray-200 object-cover"
            />
            <div>
              <h3 className="font-bold text-brand-800">Photo details</h3>
              <p className="text-[11px] text-gray-500">Every field is shown in the visitor&apos;s language.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-3">{error}</p>}

        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Shoot year</label>
            <input className="input" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025" />
          </div>
          <div>
            <label className="label">Event name</label>
            <input
              className="input"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="ATORA Annual Dealer Night 2025"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-gray-200">
          {LANGS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => setLang(l.key)}
              className={`px-4 py-2 text-sm border-b-2 -mb-px ${
                lang === l.key ? 'border-brand-600 text-brand-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="space-y-3 pt-3">
          <div>
            <label className="label">Title ({lang.toUpperCase()})</label>
            <input
              className="input"
              value={titles[lang]}
              onChange={(e) => setTitles((p) => ({ ...p, [lang]: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Caption ({lang.toUpperCase()})</label>
            <textarea
              className="input"
              rows={2}
              value={captions[lang]}
              onChange={(e) => setCaptions((p) => ({ ...p, [lang]: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Alt text ({lang.toUpperCase()})</label>
            <input
              className="input"
              value={alts[lang]}
              onChange={(e) => setAlts((p) => ({ ...p, [lang]: e.target.value }))}
              placeholder="Describe the photo for screen readers & SEO"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 mt-4 text-sm text-gray-700">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published (visible on the public About page)
        </label>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
