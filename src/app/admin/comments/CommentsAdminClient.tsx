'use client';

/**
 * CommentsAdminClient — 留言管理 (Comments moderation).
 *
 * Filters by status, free-text search, per-row approve / reject / mark spam /
 * delete, multi-select bulk actions and a CSV export.
 *
 * Only the `admin` / `superadmin` role may approve, reject or delete — the
 * server actions re-check the role, so the UI guards are a convenience only.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Comment } from '@/lib/db';
import {
  deleteCommentsAction,
  listCommentsAction,
  moderateCommentsAction,
} from '@/lib/actions';

const STATUS_TABS = [
  { key: 'pending', label: 'Pending', cls: 'bg-yellow-100 text-yellow-800' },
  { key: 'approved', label: 'Approved', cls: 'bg-green-100 text-green-800' },
  { key: 'rejected', label: 'Rejected', cls: 'bg-gray-100 text-gray-800' },
  { key: 'spam', label: 'Spam', cls: 'bg-red-100 text-red-800' },
  { key: 'all', label: 'All', cls: 'bg-brand-100 text-brand-800' },
] as const;

type StatusKey = (typeof STATUS_TABS)[number]['key'];

function statusClass(status: string): string {
  return STATUS_TABS.find((t) => t.key === status)?.cls ?? 'bg-gray-100 text-gray-800';
}

function Stars({ value }: { value: number | null }) {
  if (!value) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <span className="text-amber-500 text-xs" title={`${value}/5`}>
      {'★'.repeat(value)}
      <span className="text-gray-300">{'★'.repeat(5 - value)}</span>
    </span>
  );
}

export default function CommentsAdminClient({ initialComments }: { initialComments: Comment[] }) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [status, setStatus] = useState<StatusKey>('pending');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  async function reload(nextStatus: StatusKey = status, nextQ: string = q) {
    setComments(await listCommentsAction({ status: nextStatus, q: nextQ || undefined }));
    setSelected(new Set());
  }

  const stats = useMemo(() => {
    const out: Record<string, number> = { pending: 0, approved: 0, rejected: 0, spam: 0, all: comments.length };
    for (const c of comments) out[c.status] = (out[c.status] ?? 0) + 1;
    return out;
  }, [comments]);

  // Local filtering keeps the tabs instant; the search box hits the server.
  const visible = useMemo(
    () => (status === 'all' ? comments : comments.filter((c) => c.status === status)),
    [comments, status]
  );

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === visible.length ? new Set() : new Set(visible.map((c) => c.id))));
  }

  async function moderate(ids: number[], next: 'approved' | 'rejected' | 'spam' | 'pending', label: string) {
    if (ids.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await moderateCommentsAction(ids, next);
      if (!res.ok) setError(res.error ?? 'Action failed.');
      else {
        setNotice(`${res.updated ?? ids.length} comment(s) marked as ${label}.`);
        await reload();
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(ids: number[]) {
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} comment(s)? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await deleteCommentsAction(ids);
      if (!res.ok) setError(res.error ?? 'Delete failed.');
      else {
        setNotice(`${res.deleted ?? ids.length} comment(s) deleted.`);
        await reload();
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const exportHref = `/api/admin/comments/export?status=${status}${q ? `&q=${encodeURIComponent(q)}` : ''}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="heading-1">Comments · 留言管理</h1>
          <p className="text-sm text-gray-500">
            Visitor messages &amp; testimonials. Nothing is shown on the site until it is <b>approved</b>. Email and
            phone are stored for follow-up only and are never displayed publicly.
          </p>
        </div>
        <a href={exportHref} className="btn-secondary">⬇ Export CSV</a>
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</p>}
      {notice && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">{notice}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setStatus(t.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              status === t.key ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t.label}
            {t.key !== 'all' && ` (${stats[t.key] ?? 0})`}
          </button>
        ))}

        <div className="flex items-center gap-2 ml-auto">
          <input
            className="input max-w-xs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void reload(status, q);
            }}
            placeholder="Search name, message, email…"
          />
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void reload(status, q)}>
            Search
          </button>
          {q && (
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-800"
              onClick={() => {
                setQ('');
                void reload(status, '');
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-brand-50 border border-brand-200 p-3 text-sm">
          <span className="font-medium text-brand-800">{selected.size} selected</span>
          <button type="button" disabled={busy} className="btn-primary" onClick={() => moderate([...selected], 'approved', 'approved')}>
            Approve
          </button>
          <button type="button" disabled={busy} className="btn-secondary" onClick={() => moderate([...selected], 'rejected', 'rejected')}>
            Reject
          </button>
          <button type="button" disabled={busy} className="btn-secondary" onClick={() => moderate([...selected], 'spam', 'spam')}>
            Mark spam
          </button>
          <button type="button" disabled={busy} className="btn-danger" onClick={() => remove([...selected])}>
            Delete
          </button>
          <button type="button" className="text-xs text-gray-500 hover:text-gray-800 ml-auto" onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  checked={visible.length > 0 && selected.size === visible.length}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-2 w-36">Date</th>
              <th className="px-3 py-2 w-44">Name / Contact</th>
              <th className="px-3 py-2">Message</th>
              <th className="px-3 py-2 w-24">Rating</th>
              <th className="px-3 py-2 w-24">Status</th>
              <th className="px-3 py-2 w-52">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No comments in this view.
                </td>
              </tr>
            )}
            {visible.map((c) => (
              <tr key={c.id} className="border-t border-gray-100 align-top">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    aria-label={`Select comment ${c.id}`}
                  />
                </td>
                <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                  {c.created_at ? new Date(c.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                  <div className="text-[10px] text-gray-400">{c.language ?? ''}</div>
                </td>
                <td className="px-3 py-2 text-xs">
                  <div className="font-medium text-brand-700">{c.name}</div>
                  {c.email && <div className="text-gray-500 break-all">{c.email}</div>}
                  {c.phone && <div className="text-gray-500">{c.phone}</div>}
                  <div className="text-[10px] text-gray-400 mt-0.5">IP {c.ip ?? '—'}</div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-700">
                  <p className="whitespace-pre-line break-words max-w-xl">{c.message}</p>
                  {c.award_id && <div className="text-[10px] text-gray-400 mt-1">award #{c.award_id}</div>}
                </td>
                <td className="px-3 py-2">
                  <Stars value={c.rating} />
                </td>
                <td className="px-3 py-2">
                  <span className={`badge ${statusClass(c.status)}`}>{c.status}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
                    {c.status !== 'approved' && (
                      <button type="button" disabled={busy} onClick={() => moderate([c.id], 'approved', 'approved')} className="text-green-700 hover:text-green-800 disabled:opacity-40">
                        Approve
                      </button>
                    )}
                    {c.status !== 'rejected' && (
                      <button type="button" disabled={busy} onClick={() => moderate([c.id], 'rejected', 'rejected')} className="text-gray-700 hover:text-gray-900 disabled:opacity-40">
                        Reject
                      </button>
                    )}
                    {c.status !== 'spam' && (
                      <button type="button" disabled={busy} onClick={() => moderate([c.id], 'spam', 'spam')} className="text-amber-700 hover:text-amber-800 disabled:opacity-40">
                        Spam
                      </button>
                    )}
                    <button type="button" disabled={busy} onClick={() => remove([c.id])} className="text-red-600 hover:text-red-700 disabled:opacity-40">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        Bulk actions and CSV export respect the current status filter and search box.
      </p>
    </div>
  );
}
