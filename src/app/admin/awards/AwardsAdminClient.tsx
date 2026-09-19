'use client';

/**
 * AwardsAdminClient — 奖项管理 (Awards).
 *
 * List + create/edit (tri-lingual) + publish/unpublish + reorder + delete,
 * with a nested AwardMediaManager for the medal photos.
 * Every text field has an EN / BM / 中文 input.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Award } from '@/lib/db';
import {
  createAwardAction,
  deleteAwardAction,
  listAwardsAction,
  reorderAwardsAction,
  setAwardPublishedAction,
  updateAwardAction,
} from '@/lib/actions';
import { formatBytes, prepareImage, uploadImage } from '@/lib/imageCompress';
import AwardMediaManager from './AwardMediaManager';
import { validatePhotoFile } from '../products/ProductAlbumManager';

const LANGS = [
  { key: 'en', label: 'English (EN)' },
  { key: 'bm', label: 'Bahasa (BM)' },
  { key: 'zh', label: '中文' },
] as const;
type Lang = (typeof LANGS)[number]['key'];

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

type Draft = {
  slug: string;
  year: string;
  award_date: string;
  title: Record<Lang, string>;
  issuer: Record<Lang, string>;
  summary: Record<Lang, string>;
  story: Record<Lang, string>;
  seoTitle: Record<Lang, string>;
  seoDesc: Record<Lang, string>;
  cover_image: string;
  cover_thumb: string;
  sort_order: string;
  is_published: boolean;
};

const emptyDraft = (): Draft => ({
  slug: '',
  year: new Date().getFullYear().toString(),
  award_date: '',
  title: { en: '', bm: '', zh: '' },
  issuer: { en: '', bm: '', zh: '' },
  summary: { en: '', bm: '', zh: '' },
  story: { en: '', bm: '', zh: '' },
  seoTitle: { en: '', bm: '', zh: '' },
  seoDesc: { en: '', bm: '', zh: '' },
  cover_image: '',
  cover_thumb: '',
  sort_order: '0',
  is_published: true,
});

function draftFrom(a: Award): Draft {
  return {
    slug: a.slug,
    year: a.year ?? '',
    award_date: a.award_date ?? '',
    title: { en: a.title_en ?? '', bm: a.title_bm ?? '', zh: a.title_zh ?? '' },
    issuer: { en: a.issuer_en ?? '', bm: a.issuer_bm ?? '', zh: a.issuer_zh ?? '' },
    summary: { en: a.summary_en ?? '', bm: a.summary_bm ?? '', zh: a.summary_zh ?? '' },
    story: { en: a.story_en ?? '', bm: a.story_bm ?? '', zh: a.story_zh ?? '' },
    seoTitle: { en: a.seo_title_en ?? '', bm: a.seo_title_bm ?? '', zh: a.seo_title_zh ?? '' },
    seoDesc: { en: a.seo_desc_en ?? '', bm: a.seo_desc_bm ?? '', zh: a.seo_desc_zh ?? '' },
    cover_image: a.cover_image ?? '',
    cover_thumb: a.cover_thumb ?? '',
    sort_order: String(a.sort_order ?? 0),
    is_published: a.is_published === 1,
  };
}

export default function AwardsAdminClient({ initialAwards }: { initialAwards: Award[] }) {
  const router = useRouter();
  const [awards, setAwards] = useState<Award[]>(initialAwards);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ mode: 'create' } | { mode: 'edit'; award: Award } | null>(null);
  const [mediaFor, setMediaFor] = useState<Award | null>(null);

  async function reload() {
    setAwards(await listAwardsAction());
  }
  useEffect(() => {
    setAwards(initialAwards);
  }, [initialAwards]);

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= awards.length) return;
    const next = [...awards];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setAwards(next);
    setBusy(true);
    try {
      const res = await reorderAwardsAction(next.map((a) => a.id));
      if (!res.ok) setError(res.error ?? 'Failed to reorder.');
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(a: Award) {
    setBusy(true);
    setError(null);
    try {
      const res = await setAwardPublishedAction(a.id, a.is_published !== 1);
      if (!res.ok) setError(res.error ?? 'Failed to change status.');
      else {
        await reload();
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: Award) {
    if (!window.confirm(`Delete "${a.title_en}" and all of its images? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await deleteAwardAction(a.id);
      if (!res.ok) setError(res.error ?? 'Failed to delete.');
      else {
        await reload();
        router.refresh();
        setNotice('Award deleted.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-1">Awards · 奖项管理</h1>
          <p className="text-sm text-gray-500">
            Manage the medals &amp; awards shown on the About Us page. Each award has EN / BM / 中文 fields.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setEditing({ mode: 'create' })}>
          + New Award
        </button>
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</p>}
      {notice && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">{notice}</p>}

      {awards.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-500">
          No awards yet. Click <span className="font-medium">+ New Award</span> to add the first medal.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-3 py-2 w-20">Image</th>
                <th className="px-3 py-2">Award</th>
                <th className="px-3 py-2 w-24">Year</th>
                <th className="px-3 py-2">Issuer</th>
                <th className="px-3 py-2 w-28">Status</th>
                <th className="px-3 py-2 w-64">Actions</th>
              </tr>
            </thead>
            <tbody>
              {awards.map((a, i) => (
                <tr key={a.id} className="border-t border-gray-100 align-top">
                  <td className="px-3 py-2">
                    <div className="h-14 w-14 rounded border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                      {a.cover_thumb || a.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.cover_thumb || a.cover_image || ''} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-gray-400">none</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-brand-700">{a.title_en}</div>
                    <div className="text-xs text-gray-500">
                      {[a.title_bm, a.title_zh].filter(Boolean).join(' · ') || '—'}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">/about/awards/{a.slug}</div>
                    <div className="flex gap-1 mt-1 text-[11px]">
                      <span className={a.title_bm ? 'badge-green' : 'badge-gray'}>BM</span>
                      <span className={a.title_zh ? 'badge-green' : 'badge-gray'}>中文</span>
                      <span className={a.story_en ? 'badge-green' : 'badge-gray'}>Story</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">{a.year ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{a.issuer_en ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className={a.is_published === 1 ? 'badge-green' : 'badge-yellow'}>
                      {a.is_published === 1 ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      <button type="button" disabled={busy} onClick={() => setEditing({ mode: 'edit', award: a })} className="text-brand-600 hover:text-brand-700 disabled:opacity-40">
                        Edit
                      </button>
                      <button type="button" disabled={busy} onClick={() => setMediaFor(a)} className="text-brand-600 hover:text-brand-700 disabled:opacity-40">
                        Images
                      </button>
                      <button type="button" disabled={busy} onClick={() => togglePublished(a)} className="text-gray-700 hover:text-gray-900 disabled:opacity-40">
                        {a.is_published === 1 ? 'Unpublish' : 'Publish'}
                      </button>
                      <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} className="text-gray-600 hover:text-gray-900 disabled:opacity-30" title="Move up">↑</button>
                      <button type="button" disabled={busy || i === awards.length - 1} onClick={() => move(i, 1)} className="text-gray-600 hover:text-gray-900 disabled:opacity-30" title="Move down">↓</button>
                      <button type="button" disabled={busy} onClick={() => remove(a)} className="text-red-600 hover:text-red-700 disabled:opacity-40">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <AwardFormModal
          award={editing.mode === 'edit' ? editing.award : null}
          onClose={() => setEditing(null)}
          onSaved={async (msg) => {
            setNotice(msg);
            setEditing(null);
            await reload();
            router.refresh();
          }}
        />
      )}

      {mediaFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl my-6 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-brand-800">Award Media · 奖项图片</h3>
                <p className="text-xs text-gray-500">{mediaFor.title_en}</p>
              </div>
              <button type="button" onClick={() => setMediaFor(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <AwardMediaManager awardId={mediaFor.id} awardTitle={mediaFor.title_en} />
            <div className="flex justify-end mt-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  setMediaFor(null);
                  await reload();
                  router.refresh();
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AwardFormModal({
  award,
  onClose,
  onSaved,
}: {
  award: Award | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(award ? draftFrom(award) : emptyDraft());
  const [lang, setLang] = useState<Lang>('en');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverHint, setCoverHint] = useState<string | null>(null);

  const setLocalized = (field: 'title' | 'issuer' | 'summary' | 'story' | 'seoTitle' | 'seoDesc', value: string) =>
    setDraft((d) => ({ ...d, [field]: { ...d[field], [lang]: value } }));

  async function uploadCover(file: File | undefined) {
    if (!file) return;
    const problem = validatePhotoFile(file, MAX_SOURCE_BYTES);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setCoverBusy(true);
    try {
      const { full, thumb } = await prepareImage(file);
      const fullRes = await uploadImage(full);
      if (!fullRes.ok) {
        setError(fullRes.error);
        return;
      }
      const thumbRes = await uploadImage(thumb);
      setDraft((d) => ({
        ...d,
        cover_image: fullRes.url,
        cover_thumb: thumbRes.ok ? thumbRes.url : fullRes.url,
      }));
      setCoverHint(`Compressed ${formatBytes(file.size)} → ${formatBytes(full.size)}`);
    } finally {
      setCoverBusy(false);
    }
  }

  async function save() {
    if (!draft.title.en.trim()) {
      setError('English title is required.');
      setLang('en');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('slug', draft.slug);
      fd.set('year', draft.year);
      fd.set('award_date', draft.award_date);
      fd.set('sort_order', draft.sort_order || '0');
      fd.set('is_published', draft.is_published ? '1' : 'off');
      fd.set('cover_image', draft.cover_image);
      fd.set('cover_thumb', draft.cover_thumb);
      for (const l of ['en', 'bm', 'zh'] as Lang[]) {
        fd.set(`title_${l}`, draft.title[l]);
        fd.set(`issuer_${l}`, draft.issuer[l]);
        fd.set(`summary_${l}`, draft.summary[l]);
        fd.set(`story_${l}`, draft.story[l]);
        fd.set(`seo_title_${l}`, draft.seoTitle[l]);
        fd.set(`seo_desc_${l}`, draft.seoDesc[l]);
      }
      const res = award ? await updateAwardAction(award.id, fd) : await createAwardAction(fd);
      if (!res.ok) {
        setError(res.error ?? 'Save failed.');
        return;
      }
      onSaved(award ? 'Award updated.' : 'Award created. Add images next.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-3xl my-6 p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="font-bold text-brand-800">{award ? 'Edit award' : 'New award'}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-3">{error}</p>}

        {/* Shared (non-translated) fields */}
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label">Slug (URL)</label>
            <input
              className="input"
              value={draft.slug}
              onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
              placeholder="auto from English title"
            />
            <p className="text-[11px] text-gray-500 mt-1">/en/about/awards/&lt;slug&gt;</p>
          </div>
          <div>
            <label className="label">Year</label>
            <input
              className="input"
              value={draft.year}
              onChange={(e) => setDraft((d) => ({ ...d, year: e.target.value }))}
              placeholder="2025"
            />
          </div>
          <div>
            <label className="label">Award date (optional)</label>
            <input
              className="input"
              value={draft.award_date}
              onChange={(e) => setDraft((d) => ({ ...d, award_date: e.target.value }))}
              placeholder="2025-11-08"
            />
          </div>
          <div>
            <label className="label">Sort order</label>
            <input
              type="number"
              className="input"
              value={draft.sort_order}
              onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
            />
          </div>
        </div>

        {/* Cover image */}
        <div className="rounded-md bg-gray-50 p-3 mb-4">
          <label className="label">Cover image (medal / trophy)</label>
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
              {draft.cover_thumb || draft.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.cover_thumb || draft.cover_image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] text-gray-400">none</span>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
                disabled={coverBusy}
                onChange={(e) => uploadCover(e.target.files?.[0])}
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Auto-compressed &amp; thumbnailed. You can also just add photos under “Images” and set one as cover.
                {coverHint && <span className="text-green-700"> · {coverHint}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Language tabs */}
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
            <label className="label">Award name ({lang.toUpperCase()})</label>
            <input
              className="input"
              value={draft.title[lang]}
              onChange={(e) => setLocalized('title', e.target.value)}
              placeholder={lang === 'en' ? 'e.g. Best Wholesale Distributor 2025' : ''}
            />
          </div>
          <div>
            <label className="label">Issuing body ({lang.toUpperCase()})</label>
            <input
              className="input"
              value={draft.issuer[lang]}
              onChange={(e) => setLocalized('issuer', e.target.value)}
              placeholder={lang === 'en' ? 'e.g. Malaysia SME Business Council' : ''}
            />
          </div>
          <div>
            <label className="label">Short description ({lang.toUpperCase()})</label>
            <textarea
              className="input"
              rows={2}
              value={draft.summary[lang]}
              onChange={(e) => setLocalized('summary', e.target.value)}
              placeholder="One or two sentences shown on the award card."
            />
          </div>
          <div>
            <label className="label">Full story ({lang.toUpperCase()})</label>
            <textarea
              className="input"
              rows={6}
              value={draft.story[lang]}
              onChange={(e) => setLocalized('story', e.target.value)}
              placeholder="The full “how we won it” story, shown on the award detail page."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">SEO title ({lang.toUpperCase()})</label>
              <input
                className="input"
                value={draft.seoTitle[lang]}
                onChange={(e) => setLocalized('seoTitle', e.target.value)}
              />
            </div>
            <div>
              <label className="label">SEO description ({lang.toUpperCase()})</label>
              <input
                className="input"
                value={draft.seoDesc[lang]}
                onChange={(e) => setLocalized('seoDesc', e.target.value)}
              />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 mt-4 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={draft.is_published}
            onChange={(e) => setDraft((d) => ({ ...d, is_published: e.target.checked }))}
          />
          Published (visible on the public About page)
        </label>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : award ? 'Save changes' : 'Create award'}
          </button>
        </div>
      </div>
    </div>
  );
}
