'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TechnicalPartner } from '@/lib/db';
import { createPartnerAction, updatePartnerAction, deletePartnerAction } from '@/lib/actions';
import MediaUploader from '@/components/MediaUploader';

const SERVICE_OPTIONS = [
  'Aircond Installation', 'Aircond Repair', 'Aircond Maintenance', 'Electrical Work',
  'HVAC Service', 'Commercial Aircond', 'Industrial Aircond',
  'Project Work', 'Technical Support', 'Other',
];

export default function PartnersAdminClient({ partners }: { partners: TechnicalPartner[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<TechnicalPartner | null>(null);
  const [creating, setCreating] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Service types — combine selected checkboxes
    const selected: string[] = [];
    fd.getAll('service_types_cb').forEach((v) => {
      if (typeof v === 'string') selected.push(v);
    });
    fd.delete('service_types_cb');
    fd.set('service_types', selected.join(','));
    if (editing) await updatePartnerAction(editing.id, fd);
    else await createPartnerAction(fd);
    setEditing(null);
    setCreating(false);
    router.refresh();
  }

  function selectedServices(p: TechnicalPartner) {
    return (p.service_types ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreating(true)} className="btn-primary">+ Add Partner</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Service Types</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Featured</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No partners yet.</td></tr>
            )}
            {partners.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-brand-700">{p.company_name_en}</td>
                <td className="px-3 py-2 text-gray-600">{p.city ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  <div className="flex flex-wrap gap-1">
                    {selectedServices(p).slice(0, 3).map((s) => <span key={s} className="badge-blue">{s}</span>)}
                  </div>
                </td>
                <td className="px-3 py-2 text-gray-600">{p.telephone ?? '—'}</td>
                <td className="px-3 py-2">{p.featured === 1 ? '⭐' : '—'}</td>
                <td className="px-3 py-2"><span className={p.status === 1 ? 'badge-green' : 'badge-gray'}>{p.status === 1 ? 'Active' : 'Hidden'}</span></td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(p)} className="text-xs text-brand-600 hover:text-brand-700">Edit</button>
                    <form action={async () => { await deletePartnerAction(p.id); router.refresh(); }}>
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
              <h2 className="font-bold text-brand-800">{editing ? 'Edit' : 'New'} Partner</h2>
              <button onClick={() => { setEditing(null); setCreating(false); }}>✕</button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Company Name (EN) *</label><input name="company_name_en" required defaultValue={editing?.company_name_en ?? ''} className="input" /></div>
                <div><label className="label">Name (BM)</label><input name="company_name_bm" defaultValue={editing?.company_name_bm ?? ''} className="input" /></div>
                <div><label className="label">Name (ZH)</label><input name="company_name_zh" defaultValue={editing?.company_name_zh ?? ''} className="input" /></div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Contact Person</label><input name="contact_person" defaultValue={editing?.contact_person ?? ''} className="input" /></div>
                <div><label className="label">Telephone</label><input name="telephone" defaultValue={editing?.telephone ?? ''} className="input" /></div>
                <div><label className="label">WhatsApp</label><input name="whatsapp" defaultValue={editing?.whatsapp ?? ''} className="input" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="label">Email</label><input type="email" name="email" defaultValue={editing?.email ?? ''} className="input" /></div>
                <div><label className="label">Website</label><input name="website" defaultValue={editing?.website ?? ''} className="input" placeholder="https://" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="label">Address</label><input name="address" defaultValue={editing?.address ?? ''} className="input" /></div>
                <div><label className="label">City / State</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input name="city" defaultValue={editing?.city ?? ''} className="input" placeholder="City" />
                    <input name="state" defaultValue={editing?.state ?? ''} className="input" placeholder="State" />
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Service Types</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SERVICE_OPTIONS.map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="service_types_cb"
                        value={opt}
                        defaultChecked={editing ? selectedServices(editing).includes(opt) : false}
                        className="rounded"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Service Area (free-text)</label>
                <input name="service_area" defaultValue={editing?.service_area ?? ''} className="input" placeholder="e.g. Northern Malaysia, All Malaysia" />
              </div>
              <div><label className="label">Logo</label><MediaUploader kind="image" defaultUrl={editing?.logo_url ?? ''} name="logo_url" /></div>
              <div><label className="label">Photo</label><MediaUploader kind="image" defaultUrl={editing?.photo_url ?? ''} name="photo_url" /></div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="label">Description (EN)</label><textarea name="description_en" rows={2} defaultValue={editing?.description_en ?? ''} className="input" /></div>
                <div><label className="label">Description (BM)</label><textarea name="description_bm" rows={2} defaultValue={editing?.description_bm ?? ''} className="input" /></div>
                <div><label className="label">Description (ZH)</label><textarea name="description_zh" rows={2} defaultValue={editing?.description_zh ?? ''} className="input" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="label">Facebook</label><input name="facebook" defaultValue={editing?.facebook ?? ''} className="input" /></div>
                <div><label className="label">Google Maps URL</label><input name="google_maps_url" defaultValue={editing?.google_maps_url ?? ''} className="input" /></div>
              </div>
              <div className="border-t pt-3">
                <h3 className="font-semibold text-brand-800 mb-2 text-sm">Privacy — Public Visibility</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" name="show_phone" defaultChecked={editing?.show_phone !== 0} className="rounded" /> Phone</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" name="show_whatsapp" defaultChecked={editing?.show_whatsapp !== 0} className="rounded" /> WhatsApp</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" name="show_email" defaultChecked={editing?.show_email !== 0} className="rounded" /> Email</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" name="show_address" defaultChecked={editing?.show_address !== 0} className="rounded" /> Address</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" name="show_website" defaultChecked={editing?.show_website !== 0} className="rounded" /> Website</label>
                </div>
              </div>
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
