'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brand } from '@/lib/db';
import { createBrandAction, updateBrandAction, deleteBrandAction } from '@/lib/actions';
import MediaUploader from '@/components/MediaUploader';

export default function BrandsAdminClient({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Brand | null>(null);
  const [creating, setCreating] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>, editing: Brand | null) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (editing) await updateBrandAction(editing.id, fd);
    else await createBrandAction(fd);
    setEditing(null);
    setCreating(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreating(true)} className="btn-primary">+ Add Brand</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-3 py-2">Logo</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Chinese</th>
                <th className="px-3 py-2">Featured</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No brands yet. Add one to get started.</td></tr>
              )}
              {brands.map((b) => (
                <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logo} alt={b.name_en} className="h-8 w-8 object-contain" />
                    ) : <div className="h-8 w-8 rounded bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs">{b.name_en.charAt(0)}</div>}
                  </td>
                  <td className="px-3 py-2 font-medium text-brand-700">{b.name_en}</td>
                  <td className="px-3 py-2 text-gray-600">{b.name_zh ?? '—'}</td>
                  <td className="px-3 py-2">{b.featured === 1 ? '⭐' : '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{b.display_order}</td>
                  <td className="px-3 py-2"><span className={b.status === 1 ? 'badge-green' : 'badge-gray'}>{b.status === 1 ? 'Active' : 'Hidden'}</span></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(b)} className="text-xs text-brand-600 hover:text-brand-700">Edit</button>
                      <form action={async () => { await deleteBrandAction(b.id); router.refresh(); }}>
                        <button className="text-xs text-red-600 hover:text-red-700">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-brand-800">{editing ? 'Edit Brand' : 'New Brand'}</h2>
              <button onClick={() => { setEditing(null); setCreating(false); }}>✕</button>
            </div>
            <form onSubmit={(e) => submit(e, editing)} className="p-6 space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Name (EN) *</label><input name="name_en" required defaultValue={editing?.name_en ?? ''} className="input" /></div>
                <div><label className="label">Name (BM)</label><input name="name_bm" defaultValue={editing?.name_bm ?? ''} className="input" /></div>
                <div><label className="label">Name (ZH)</label><input name="name_zh" defaultValue={editing?.name_zh ?? ''} className="input" /></div>
              </div>
              <div><label className="label">Logo</label><MediaUploader kind="image" defaultUrl={editing?.logo ?? ''} name="logo" /></div>
              <div><label className="label">Description (EN)</label><textarea name="description_en" rows={2} defaultValue={editing?.description_en ?? ''} className="input" /></div>
              <div><label className="label">Description (BM)</label><textarea name="description_bm" rows={2} defaultValue={editing?.description_bm ?? ''} className="input" /></div>
              <div><label className="label">Description (ZH)</label><textarea name="description_zh" rows={2} defaultValue={editing?.description_zh ?? ''} className="input" /></div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Display Order</label><input type="number" name="display_order" defaultValue={editing?.display_order ?? 0} className="input" /></div>
                <label className="inline-flex items-center gap-2 text-sm pt-6"><input type="checkbox" name="featured" defaultChecked={editing?.featured === 1} className="rounded" /> Featured</label>
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
