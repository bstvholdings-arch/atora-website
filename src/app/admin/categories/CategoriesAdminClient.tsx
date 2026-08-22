'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/lib/db';
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/lib/actions';

export default function CategoriesAdminClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (editing) await updateCategoryAction(editing.id, fd);
    else await createCategoryAction(fd);
    setEditing(null);
    setCreating(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreating(true)} className="btn-primary">+ Add Category</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-3 py-2">Name (EN)</th>
              <th className="px-3 py-2">Parent</th>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No categories yet.</td></tr>
            )}
            {categories.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-brand-700">{c.name_en}</td>
                <td className="px-3 py-2 text-gray-600">{categories.find((p) => p.id === c.parent_id)?.name_en ?? '—'}</td>
                <td className="px-3 py-2 text-gray-600">{c.display_order}</td>
                <td className="px-3 py-2"><span className={c.status === 1 ? 'badge-green' : 'badge-gray'}>{c.status === 1 ? 'Active' : 'Hidden'}</span></td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(c)} className="text-xs text-brand-600 hover:text-brand-700">Edit</button>
                    <form action={async () => { await deleteCategoryAction(c.id); router.refresh(); }}>
                      <button className="text-xs text-red-600 hover:text-red-700">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-xl">
            <div className="border-b px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-brand-800">{editing ? 'Edit' : 'New'} Category</h2>
              <button onClick={() => { setEditing(null); setCreating(false); }}>✕</button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Name (EN) *</label><input name="name_en" required defaultValue={editing?.name_en ?? ''} className="input" /></div>
                <div><label className="label">Name (BM)</label><input name="name_bm" defaultValue={editing?.name_bm ?? ''} className="input" /></div>
                <div><label className="label">Name (ZH)</label><input name="name_zh" defaultValue={editing?.name_zh ?? ''} className="input" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Parent</label>
                  <select name="parent_id" defaultValue={editing?.parent_id ?? ''} className="input">
                    <option value="">— None —</option>
                    {categories.filter((c) => c.id !== editing?.id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name_en}</option>
                    ))}
                  </select>
                </div>
                <div><label className="label">Display Order</label><input type="number" name="display_order" defaultValue={editing?.display_order ?? 0} className="input" /></div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="status" defaultChecked={editing?.status !== 0} className="rounded" /> Active</label>
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
