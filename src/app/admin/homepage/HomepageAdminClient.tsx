'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomepageContent } from '@/lib/db';
import { upsertHomepageSectionAction } from '@/lib/actions';
import MediaUploader from '@/components/MediaUploader';

export default function HomepageAdminClient({ initialSections }: { initialSections: HomepageContent[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [editing, setEditing] = useState<HomepageContent | null>(null);
  const [creating, setCreating] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await upsertHomepageSectionAction(fd);
    setEditing(null);
    setCreating(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreating(true)} className="btn-primary">+ New Section</button>
      </div>

      <div className="space-y-2">
        {sections.length === 0 && <div className="card p-8 text-center text-gray-500">No homepage sections. The homepage uses defaults.</div>}
        {sections.map((s) => (
          <div key={s.section_key} className="card p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-brand-800">{s.section_key}</div>
              <div className="text-sm text-gray-600">
                {s.title_en ?? '—'}
              </div>
              <div className="flex gap-2 mt-1">
                <span className={s.enabled === 1 ? 'badge-green' : 'badge-gray'}>{s.enabled === 1 ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
            <button onClick={() => setEditing(s)} className="btn-secondary text-xs">Edit</button>
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-brand-800">{editing ? `Edit: ${editing.section_key}` : 'New Section'}</h2>
              <button onClick={() => { setEditing(null); setCreating(false); }}>✕</button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-3">
              {!editing && (
                <div>
                  <label className="label">Section Key</label>
                  <input name="section_key" required placeholder="product_videos" className="input" />
                </div>
              )}
              {editing && <input type="hidden" name="section_key" value={editing.section_key} />}

              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Title (EN)</label><input name="title_en" defaultValue={editing?.title_en ?? ''} className="input" /></div>
                <div><label className="label">Title (BM)</label><input name="title_bm" defaultValue={editing?.title_bm ?? ''} className="input" /></div>
                <div><label className="label">Title (ZH)</label><input name="title_zh" defaultValue={editing?.title_zh ?? ''} className="input" /></div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Subtitle (EN)</label><input name="subtitle_en" defaultValue={editing?.subtitle_en ?? ''} className="input" /></div>
                <div><label className="label">Subtitle (BM)</label><input name="subtitle_bm" defaultValue={editing?.subtitle_bm ?? ''} className="input" /></div>
                <div><label className="label">Subtitle (ZH)</label><input name="subtitle_zh" defaultValue={editing?.subtitle_zh ?? ''} className="input" /></div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Body (EN)</label><textarea name="body_en" rows={3} defaultValue={editing?.body_en ?? ''} className="input" /></div>
                <div><label className="label">Body (BM)</label><textarea name="body_bm" rows={3} defaultValue={editing?.body_bm ?? ''} className="input" /></div>
                <div><label className="label">Body (ZH)</label><textarea name="body_zh" rows={3} defaultValue={editing?.body_zh ?? ''} className="input" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="label">Image</label><MediaUploader kind="image" defaultUrl={editing?.image_url ?? ''} name="image_url" /></div>
                <div><label className="label">Video</label><MediaUploader kind="video" defaultUrl={editing?.video_url ?? ''} name="video_url" /></div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">CTA Label (EN)</label><input name="cta_label_en" defaultValue={editing?.cta_label_en ?? ''} className="input" /></div>
                <div><label className="label">CTA Label (BM)</label><input name="cta_label_bm" defaultValue={editing?.cta_label_bm ?? ''} className="input" /></div>
                <div><label className="label">CTA Label (ZH)</label><input name="cta_label_zh" defaultValue={editing?.cta_label_zh ?? ''} className="input" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="label">CTA URL</label><input name="cta_url" defaultValue={editing?.cta_url ?? ''} className="input" /></div>
                <div><label className="label">Display Order</label><input type="number" name="display_order" defaultValue={editing?.display_order ?? 0} className="input" /></div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={editing?.enabled === 1} className="rounded" /> Enabled</label>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => { setEditing(null); setCreating(false); }} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
