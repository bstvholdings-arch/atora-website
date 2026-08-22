'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FAQ } from '@/lib/db';
import { createFaqAction, updateFaqAction, deleteFaqAction } from '@/lib/actions';

export default function FaqsAdminClient({ faqs }: { faqs: FAQ[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [creating, setCreating] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (editing) await updateFaqAction(editing.id, fd);
    else await createFaqAction(fd);
    setEditing(null);
    setCreating(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreating(true)} className="btn-primary">+ Add FAQ</button>
      </div>

      <div className="space-y-2">
        {faqs.length === 0 && <div className="card p-8 text-center text-gray-500">No FAQs yet.</div>}
        {faqs.map((f) => (
          <div key={f.id} className="card p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-brand-800">{f.question_en}</div>
              <p className="text-sm text-gray-600 line-clamp-2">{f.answer_en}</p>
              <div className="flex gap-2 mt-2">
                {f.question_bm && <span className="badge-blue">BM</span>}
                {f.question_zh && <span className="badge-blue">ZH</span>}
                <span className={f.status === 1 ? 'badge-green' : 'badge-gray'}>{f.status === 1 ? 'Active' : 'Hidden'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => setEditing(f)} className="text-xs text-brand-600 hover:text-brand-700">Edit</button>
              <form action={async () => { await deleteFaqAction(f.id); router.refresh(); }}>
                <button className="text-xs text-red-600 hover:text-red-700">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-brand-800">{editing ? 'Edit' : 'New'} FAQ</h2>
              <button onClick={() => { setEditing(null); setCreating(false); }}>✕</button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div className="md:col-span-3"><label className="label">Question (EN) *</label><input name="question_en" required defaultValue={editing?.question_en ?? ''} className="input" /></div>
                <div><label className="label">Question (BM)</label><input name="question_bm" defaultValue={editing?.question_bm ?? ''} className="input" /></div>
                <div><label className="label">Question (ZH)</label><input name="question_zh" defaultValue={editing?.question_zh ?? ''} className="input" /></div>
                <div><label className="label">Category</label><input name="category" defaultValue={editing?.category ?? ''} className="input" /></div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Answer (EN) *</label><textarea name="answer_en" rows={4} required defaultValue={editing?.answer_en ?? ''} className="input" /></div>
                <div><label className="label">Answer (BM)</label><textarea name="answer_bm" rows={4} defaultValue={editing?.answer_bm ?? ''} className="input" /></div>
                <div><label className="label">Answer (ZH)</label><textarea name="answer_zh" rows={4} defaultValue={editing?.answer_zh ?? ''} className="input" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="label">Display Order</label><input type="number" name="display_order" defaultValue={editing?.display_order ?? 0} className="input" /></div>
                <label className="inline-flex items-center gap-2 text-sm pt-6"><input type="checkbox" name="status" defaultChecked={editing?.status !== 0} className="rounded" /> Active</label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => { setEditing(null); setCreating(false); }} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
