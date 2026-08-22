'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Location } from '@/lib/db';
import { createLocationAction, updateLocationAction, deleteLocationAction } from '@/lib/actions';
import MediaUploader from '@/components/MediaUploader';

export default function LocationsAdminClient({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Location | null>(null);
  const [creating, setCreating] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (editing) await updateLocationAction(editing.id, fd);
    else await createLocationAction(fd);
    setEditing(null);
    setCreating(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreating(true)} className="btn-primary">+ Add Location</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">WhatsApp</th>
              <th className="px-3 py-2">Maps Place ID</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">No locations yet.</td></tr>
            )}
            {locations.map((l) => (
              <tr key={l.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-brand-700">
                  {l.name_en}
                  {l.is_hq === 1 && <span className="ml-2 badge-blue">HQ</span>}
                </td>
                <td className="px-3 py-2 text-gray-600 capitalize">{l.type}</td>
                <td className="px-3 py-2 text-gray-600">{l.city ?? '—'}</td>
                <td className="px-3 py-2 text-gray-600">{l.telephone ?? '—'}</td>
                <td className="px-3 py-2 text-gray-600">{l.whatsapp ?? '—'}</td>
                <td className="px-3 py-2 text-gray-600 font-mono text-xs">{l.google_maps_place_id ?? '—'}</td>
                <td className="px-3 py-2"><span className={l.status === 1 ? 'badge-green' : 'badge-gray'}>{l.status === 1 ? 'Active' : 'Hidden'}</span></td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(l)} className="text-xs text-brand-600 hover:text-brand-700">Edit</button>
                    <form action={async () => { await deleteLocationAction(l.id); router.refresh(); }}>
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-brand-800">{editing ? 'Edit' : 'New'} Location</h2>
              <button onClick={() => { setEditing(null); setCreating(false); }}>✕</button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Name (EN) *</label><input name="name_en" required defaultValue={editing?.name_en ?? ''} className="input" /></div>
                <div><label className="label">Name (BM)</label><input name="name_bm" defaultValue={editing?.name_bm ?? ''} className="input" /></div>
                <div><label className="label">Name (ZH)</label><input name="name_zh" defaultValue={editing?.name_zh ?? ''} className="input" /></div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select name="type" defaultValue={editing?.type ?? 'branch'} className="input">
                    <option value="branch">Branch</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="hq">HQ</option>
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 text-sm pt-6"><input type="checkbox" name="is_hq" defaultChecked={editing?.is_hq === 1} className="rounded" /> HQ</label>
                <div><label className="label">Display Order</label><input type="number" name="display_order" defaultValue={editing?.display_order ?? 0} className="input" /></div>
              </div>
              <div>
                <label className="label">Address</label>
                <textarea name="address" rows={2} defaultValue={editing?.address ?? ''} className="input" />
              </div>
              <div className="grid md:grid-cols-4 gap-3">
                <div><label className="label">City</label><input name="city" defaultValue={editing?.city ?? ''} className="input" /></div>
                <div><label className="label">State</label><input name="state" defaultValue={editing?.state ?? ''} className="input" /></div>
                <div><label className="label">Postal Code</label><input name="postal_code" defaultValue={editing?.postal_code ?? ''} className="input" /></div>
                <div><label className="label">Country</label><input name="country" defaultValue={editing?.country ?? 'Malaysia'} className="input" /></div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Telephone</label><input name="telephone" defaultValue={editing?.telephone ?? ''} className="input" placeholder="010-xxx xxxx" /></div>
                <div><label className="label">WhatsApp</label><input name="whatsapp" defaultValue={editing?.whatsapp ?? ''} className="input" placeholder="601xxxxxxxxx" /></div>
                <div><label className="label">Email</label><input name="email" type="email" defaultValue={editing?.email ?? ''} className="input" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="label">Opening Hours</label><input name="opening_hours" defaultValue={editing?.opening_hours ?? ''} className="input" placeholder="Saturday — Thursday · 9:00 AM — 6:00 PM" /></div>
                <div><label className="label">Google Maps URL</label><input name="google_maps_url" defaultValue={editing?.google_maps_url ?? ''} className="input" placeholder="https://maps.app.goo.gl/..." /></div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Google Maps Place ID</label><input name="google_maps_place_id" defaultValue={editing?.google_maps_place_id ?? ''} className="input" placeholder="ChIJ..." /></div>
                <div><label className="label">Latitude</label><input name="latitude" type="number" step="any" defaultValue={editing?.latitude ?? ''} className="input" /></div>
                <div><label className="label">Longitude</label><input name="longitude" type="number" step="any" defaultValue={editing?.longitude ?? ''} className="input" /></div>
              </div>
              <div><label className="label">Store Photo</label><MediaUploader kind="image" defaultUrl={editing?.photo_url ?? ''} name="photo_url" /></div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Description (EN)</label><textarea name="description_en" rows={2} defaultValue={editing?.description_en ?? ''} className="input" /></div>
                <div><label className="label">Description (BM)</label><textarea name="description_bm" rows={2} defaultValue={editing?.description_bm ?? ''} className="input" /></div>
                <div><label className="label">Description (ZH)</label><textarea name="description_zh" rows={2} defaultValue={editing?.description_zh ?? ''} className="input" /></div>
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
