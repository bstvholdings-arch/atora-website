'use client';

/**
 * AwardMediaManager — 奖项图片管理 (medal / trophy / certificate photos).
 *
 * Responsibilities:
 *  - multi-file upload with client-side compression + thumbnail generation
 *  - drag-and-drop (or ↑ ↓) reordering, persisted via a server action
 *  - cover selection (the cover is mirrored onto awards.cover_image)
 *  - per-language caption + alt text
 */
import { useEffect, useRef, useState } from 'react';
import type { AwardMedia } from '@/lib/db';
import {
  addAwardMediaAction,
  deleteAwardMediaAction,
  listAwardMediaAction,
  reorderAwardMediaAction,
  setAwardMediaCoverAction,
  updateAwardMediaAction,
} from '@/lib/actions';
import { formatBytes, prepareImage, uploadImage } from '@/lib/imageCompress';
import { validatePhotoFile } from '../products/ProductAlbumManager';

/** Source files may be large because we compress before uploading. */
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

const LANGS = [
  { key: 'en', label: 'EN' },
  { key: 'bm', label: 'BM' },
  { key: 'zh', label: '中文' },
] as const;
type Lang = (typeof LANGS)[number]['key'];

export default function AwardMediaManager({ awardId, awardTitle }: { awardId: number; awardTitle: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<AwardMedia[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [editing, setEditing] = useState<AwardMedia | null>(null);
  const [savedHint, setSavedHint] = useState<string | null>(null);

  async function reload() {
    setMedia(await listAwardMediaAction(awardId));
  }
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awardId]);

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setNotice(null);

    const files = Array.from(fileList);
    const problems = files
      .map((f) => validatePhotoFile(f, MAX_SOURCE_BYTES))
      .filter(Boolean) as string[];
    if (problems.length > 0) {
      setError(problems.join(' · '));
      return;
    }

    setBusy(true);
    let saved = 0;
    let savedBytes = 0;
    try {
      const uploaded: { file_path: string; thumb_path: string | null }[] = [];
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
        });
        setProgress(`Uploaded ${i + 1}/${files.length}`);
      }

      if (uploaded.length > 0) {
        const res = await addAwardMediaAction(awardId, uploaded);
        if (!res.ok) setError(res.error ?? 'Failed to save images.');
        else {
          saved = res.added ?? uploaded.length;
          await reload();
          setNotice(
            `${saved} image(s) added${savedBytes > 0 ? ` · compressed, saved ≈ ${formatBytes(savedBytes)}` : ''}.`
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

  async function persistOrder(next: AwardMedia[]) {
    setBusy(true);
    try {
      await reorderAwardMediaAction(awardId, next.map((m) => m.id));
      await reload();
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= media.length) return;
    const next = [...media];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    void persistOrder(next);
  }

  function onDrop(targetId: number) {
    if (dragId === null || dragId === targetId) return;
    const from = media.findIndex((m) => m.id === dragId);
    const to = media.findIndex((m) => m.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...media];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null);
    setOverId(null);
    void persistOrder(next);
  }

  async function onDelete(m: AwardMedia) {
    if (!window.confirm('Delete this image? This cannot be undone.')) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAwardMediaAction(m.id);
      await reload();
      setNotice('Image deleted.');
    } finally {
      setBusy(false);
    }
  }

  async function onSetCover(m: AwardMedia) {
    setBusy(true);
    try {
      await setAwardMediaCoverAction(awardId, m.id);
      await reload();
      setNotice('Cover updated.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-semibold text-brand-800 text-sm">Award Media · 奖牌图片</h4>
        <p className="text-[11px] text-gray-500 mt-0.5">
          JPG / PNG / WEBP / GIF, up to {MAX_SOURCE_BYTES / 1024 / 1024}MB each (compressed automatically).
          Drag to reorder, or use ↑ ↓. The cover shows on the award card.
        </p>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}
      {notice && <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">{notice}</p>}
      {progress && <p className="text-xs text-brand-700">{progress}</p>}

      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
        multiple
        disabled={busy}
        onChange={(e) => uploadFiles(e.target.files)}
        className="block w-full max-w-sm text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-600 file:text-white hover:file:bg-brand-700 disabled:opacity-50"
      />

      {media.length === 0 ? (
        <p className="text-xs text-gray-500">No images yet. Upload the medal / trophy photo to get started.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {media.map((m, i) => (
            <div
              key={m.id}
              draggable={!busy}
              onDragStart={() => setDragId(m.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(m.id);
              }}
              onDragLeave={() => setOverId((cur) => (cur === m.id ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(m.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={`border rounded-md bg-white p-2 flex flex-col cursor-move transition ${
                overId === m.id ? 'border-brand-500 ring-2 ring-brand-200' : 'border-gray-200'
              }`}
            >
              <div className="h-24 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.thumb_path ?? m.file_path} alt={m.alt_en ?? ''} className="h-full w-full object-cover" />
              </div>
              <div className="mt-2 space-y-1">
                <span className={m.is_cover ? 'badge-green' : 'badge-gray'}>{m.is_cover ? 'Cover' : `#${i + 1}`}</span>
                <p className="text-[10px] text-gray-400 truncate">
                  {(m.caption_en || m.alt_en || '—').slice(0, 40)}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <button type="button" disabled={busy} onClick={() => setEditing(m)} className="text-brand-600 hover:text-brand-700 disabled:opacity-40">
                  Alt/Caption
                </button>
                {!m.is_cover && (
                  <button type="button" disabled={busy} onClick={() => onSetCover(m)} className="text-brand-600 hover:text-brand-700 disabled:opacity-40">
                    Cover
                  </button>
                )}
                <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} className="text-gray-600 hover:text-gray-900 disabled:opacity-30" title="Move up">↑</button>
                <button type="button" disabled={busy || i === media.length - 1} onClick={() => move(i, 1)} className="text-gray-600 hover:text-gray-900 disabled:opacity-30" title="Move down">↓</button>
                <button type="button" disabled={busy} onClick={() => onDelete(m)} className="text-red-600 hover:text-red-700 disabled:opacity-40">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <MediaMetaModal
          media={editing}
          awardTitle={awardTitle}
          onClose={() => setEditing(null)}
          onSaved={async (msg) => {
            setSavedHint(msg);
            setEditing(null);
            await reload();
            setNotice('Caption / alt text saved.');
            setTimeout(() => setSavedHint(null), 3000);
          }}
        />
      )}
      {savedHint && <p className="text-xs text-green-700">{savedHint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function MediaMetaModal({
  media,
  awardTitle,
  onClose,
  onSaved,
}: {
  media: AwardMedia;
  awardTitle: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [lang, setLang] = useState<Lang>('en');
  const [captions, setCaptions] = useState<Record<Lang, string>>({
    en: media.caption_en ?? '',
    bm: media.caption_bm ?? '',
    zh: media.caption_zh ?? '',
  });
  const [alts, setAlts] = useState<Record<Lang, string>>({
    en: media.alt_en ?? '',
    bm: media.alt_bm ?? '',
    zh: media.alt_zh ?? '',
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set('caption_en', captions.en);
      fd.set('caption_bm', captions.bm);
      fd.set('caption_zh', captions.zh);
      fd.set('alt_en', alts.en);
      fd.set('alt_bm', alts.bm);
      fd.set('alt_zh', alts.zh);
      const res = await updateAwardMediaAction(media.id, fd);
      onSaved(res.ok ? 'Saved.' : res.error ?? 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-brand-800">Image details</h3>
            <p className="text-[11px] text-gray-500">{awardTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="flex gap-1 border-b border-gray-200 mb-3">
          {LANGS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => setLang(l.key)}
              className={`px-3 py-1.5 text-xs border-b-2 -mb-px ${
                lang === l.key ? 'border-brand-600 text-brand-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">Caption ({lang.toUpperCase()})</label>
            <input
              className="input"
              value={captions[lang]}
              onChange={(e) => setCaptions((p) => ({ ...p, [lang]: e.target.value }))}
              placeholder="e.g. Gold medal — Malaysia SME Excellence Award"
            />
          </div>
          <div>
            <label className="label">Alt text ({lang.toUpperCase()})</label>
            <input
              className="input"
              value={alts[lang]}
              onChange={(e) => setAlts((p) => ({ ...p, [lang]: e.target.value }))}
              placeholder="Describe the image for screen readers & SEO"
            />
          </div>
          <p className="text-[11px] text-gray-500">Alt text is output in the visitor&apos;s language on the public site.</p>
        </div>

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
