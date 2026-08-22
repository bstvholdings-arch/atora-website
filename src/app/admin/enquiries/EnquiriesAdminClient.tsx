'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Enquiry } from '@/lib/db';
import { updateEnquiryStatusAction, deleteEnquiryAction } from '@/lib/actions';

const STATUSES = ['NEW', 'CONTACTED', 'QUOTED', 'COMPLETED', 'CANCELLED'];

export default function EnquiriesAdminClient({ enquiries }: { enquiries: Enquiry[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewing, setViewing] = useState<Enquiry | null>(null);

  const filtered = enquiries.filter((e) => statusFilter === 'all' ? true : e.status === statusFilter);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {['all', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={[
              'px-3 py-1 rounded-full text-xs font-medium border',
              statusFilter === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
            ].join(' ')}
          >
            {s} {s !== 'all' && `(${enquiries.filter((e) => e.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Brand / Model</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No enquiries.</td></tr>
            )}
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-gray-100">
                <td className="px-3 py-2 text-xs text-gray-500">{e.created_at}</td>
                <td className="px-3 py-2 font-medium text-brand-700">{e.name ?? '—'}</td>
                <td className="px-3 py-2 text-xs">
                  <div>{e.phone ?? e.whatsapp ?? '—'}</div>
                  {e.email && <div className="text-gray-500">{e.email}</div>}
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">{[e.brand, e.model].filter(Boolean).join(' / ') || '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{e.quantity ?? '—'}</td>
                <td className="px-3 py-2">
                  <span className={statusClass(e.status)}>{e.status}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button onClick={() => setViewing(e)} className="text-xs text-brand-600 hover:text-brand-700">View</button>
                    <form action={async (fd) => { await deleteEnquiryAction(e.id); router.refresh(); }}>
                      <button className="text-xs text-red-600 hover:text-red-700">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-brand-800">Enquiry #{viewing.id}</h2>
              <button onClick={() => setViewing(null)}>✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Field label="Name" value={viewing.name} />
                <Field label="Phone" value={viewing.phone} />
                <Field label="WhatsApp" value={viewing.whatsapp} />
                <Field label="Email" value={viewing.email} />
                <Field label="Brand" value={viewing.brand} />
                <Field label="Model" value={viewing.model} />
                <Field label="Quantity" value={viewing.quantity} />
                <Field label="Type" value={viewing.type} />
                <Field label="Source" value={viewing.source_page} />
                <Field label="Date" value={viewing.created_at} />
              </div>
              {viewing.message && (
                <div>
                  <h3 className="font-semibold text-brand-700 text-sm mb-1">Message</h3>
                  <div className="bg-gray-50 rounded p-3 text-sm whitespace-pre-wrap">{viewing.message}</div>
                </div>
              )}
              {viewing.photo_url && (
                <div>
                  <h3 className="font-semibold text-brand-700 text-sm mb-1">Photo</h3>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={viewing.photo_url} alt="Enquiry" className="rounded max-h-72" />
                </div>
              )}
              {viewing.video_url && (
                <div>
                  <h3 className="font-semibold text-brand-700 text-sm mb-1">Video</h3>
                  <video src={viewing.video_url} controls className="rounded max-h-72 w-full" />
                </div>
              )}
              <form
                action={async (fd) => { await updateEnquiryStatusAction(viewing.id, fd); router.refresh(); setViewing(null); }}
                className="flex items-center gap-2 pt-3 border-t"
              >
                <label className="text-sm font-medium">Status:</label>
                <select name="status" defaultValue={viewing.status} className="input max-w-[180px]">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn-primary">Save</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase">{label}</div>
      <div className="font-medium text-brand-800">{value || '—'}</div>
    </div>
  );
}

function statusClass(status: string): string {
  switch (status) {
    case 'NEW': return 'badge-blue';
    case 'CONTACTED': return 'badge-yellow';
    case 'QUOTED': return 'badge-green';
    case 'COMPLETED': return 'badge-green';
    case 'CANCELLED': return 'badge-gray';
    default: return 'badge-gray';
  }
}
