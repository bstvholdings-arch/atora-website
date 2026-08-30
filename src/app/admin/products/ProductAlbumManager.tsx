'use client';

/**
 * ProductAlbumManager — "产品相册" section on the product edit panel.
 *
 * Stores everything in the existing `product_media` table (see
 * scripts/supabase-schema.sql). Cover = is_primary, order = display_order.
 * Photos only (jpg / png / gif, ≤5MB each); videos stay in the Media section.
 */
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductMedia } from '@/lib/db';
import {
    getProductMediaAction,
    addProductPhotosAction,
    deleteProductMediaAction,
    setProductMediaCover,
    updateProductMediaOrder,
} from '@/lib/actions';

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PHOTO_EXT = ['jpg', 'jpeg', 'png', 'gif'];

/** Client-side half of the 双重校验 (server re-checks in /api/upload). */
export function validatePhotoFile(file: File): string | null {
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (!ALLOWED_PHOTO_EXT.includes(ext)) {
        return `${file.name}: only JPG, PNG or GIF allowed`;
    }
    if (file.size > MAX_PHOTO_BYTES) {
        return `${file.name}: ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the 5MB limit`;
    }
    return null;
}

function fileNameOf(url: string): string {
    try {
        const clean = url.split('?')[0];
        return decodeURIComponent(clean.split('/').pop() || clean);
    }
    catch {
        return url;
    }
}

function uploadedAt(value?: string | null): string {
    if (!value)
        return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
        return '—';
    return d.toLocaleString('en-GB', {
        year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
}

export default function ProductAlbumManager({ productId }: { productId: number }) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [photos, setPhotos] = useState<ProductMedia[]>([]);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [dragId, setDragId] = useState<number | null>(null);
    const [overId, setOverId] = useState<number | null>(null);

    async function reload() {
        const all = await getProductMediaAction(productId);
        setPhotos(all.filter((m) => m.type !== 'video'));
    }

    // Cover first, then manual order.
    const ordered = [...photos].sort((a, b) => {
        if (!!b.is_primary !== !!a.is_primary)
            return (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0);
        return (a.display_order ?? 0) - (b.display_order ?? 0) || a.id - b.id;
    });

    useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [productId]);

    async function uploadFiles(fileList: FileList | null) {
        if (!fileList || fileList.length === 0)
            return;
        setError(null);
        setNotice(null);

        const files = Array.from(fileList);
        const problems = files.map(validatePhotoFile).filter(Boolean) as string[];
        if (problems.length > 0) {
            setError(problems.join(' · '));
            return;
        }

        setBusy(true);
        const uploaded: { url: string; alt_text: string | null }[] = [];
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setProgress(`Uploading ${i + 1}/${files.length} — ${file.name}`);
                const fd = new FormData();
                fd.append('file', file);
                fd.append('kind', 'photo');
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                const data = await res.json();
                if (!res.ok || !data.ok) {
                    setError(data?.error ? `${file.name}: ${data.error}` : `${file.name}: upload failed`);
                    break;
                }
                uploaded.push({ url: data.url as string, alt_text: null });
            }

            if (uploaded.length > 0) {
                const hadCover = photos.some((p) => p.is_primary);
                const result = await addProductPhotosAction(productId, uploaded, false);
                if (!result.ok) {
                    setError(result.error ?? 'Failed to save photos.');
                }
                else {
                    setNotice(`${result.added ?? uploaded.length} photo(s) added.${hadCover ? '' : ' First photo set as cover.'}`);
                    await reload();
                    router.refresh();
                }
            }
        }
        catch {
            setError('Upload failed. Please try again.');
        }
        finally {
            setBusy(false);
            setProgress(null);
            if (fileRef.current)
                fileRef.current.value = '';
        }
    }

    async function onDelete(photo: ProductMedia) {
        if (!window.confirm(`Delete this photo?\n\n${fileNameOf(photo.url)}\n\nThis cannot be undone.`))
            return;
        setError(null);
        setNotice(null);
        setBusy(true);
        try {
            await deleteProductMediaAction(photo.id);
            await reload();
            router.refresh();
            setNotice('Photo deleted.');
        }
        finally {
            setBusy(false);
        }
    }

    async function onSetCover(id: number) {
        setBusy(true);
        setError(null);
        try {
            await setProductMediaCover(id, productId);
            await reload();
            router.refresh();
            setNotice('Cover updated.');
        }
        finally {
            setBusy(false);
        }
    }

    async function persistOrder(next: ProductMedia[]) {
        setBusy(true);
        try {
            await updateProductMediaOrder(productId, next.map((p) => p.id));
            await reload();
            router.refresh();
        }
        finally {
            setBusy(false);
        }
    }

    function move(index: number, delta: number) {
        const target = index + delta;
        if (target < 0 || target >= ordered.length)
            return;
        const next = [...ordered];
        const [moved] = next.splice(index, 1);
        next.splice(target, 0, moved);
        void persistOrder(next);
    }

    function onDrop(targetId: number) {
        if (dragId === null || dragId === targetId)
            return;
        const from = ordered.findIndex((p) => p.id === dragId);
        const to = ordered.findIndex((p) => p.id === targetId);
        if (from < 0 || to < 0)
            return;
        const next = [...ordered];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setDragId(null);
        setOverId(null);
        void persistOrder(next);
    }

    return (
        <div className="rounded-md bg-gray-50 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="font-semibold text-brand-800">产品相册 · Product Album</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        JPG / PNG / GIF only, max 5MB each. Drag to reorder, or use ↑ ↓. The cover photo shows first on the product page.
                    </p>
                </div>
                <span className="text-xs text-gray-500">{photos.length} photo(s)</span>
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}
            {notice && <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">{notice}</p>}
            {progress && <p className="text-xs text-brand-700">{progress}</p>}

            {/* Upload */}
            <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-3">
                <input
                    ref={fileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"
                    multiple
                    disabled={busy}
                    onChange={(e) => uploadFiles(e.target.files)}
                    className="block w-full max-w-sm text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-600 file:text-white hover:file:bg-brand-700 disabled:opacity-50"
                />
                {busy && <span className="text-xs text-gray-500">Working…</span>}
            </div>

            {/* Grid */}
            {ordered.length === 0 ? (
                <p className="text-xs text-gray-500">No photos yet. Upload one to get started.</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {ordered.map((p, i) => (
                        <div
                            key={p.id}
                            draggable={!busy}
                            onDragStart={() => setDragId(p.id)}
                            onDragOver={(e) => { e.preventDefault(); setOverId(p.id); }}
                            onDragLeave={() => setOverId((cur) => (cur === p.id ? null : cur))}
                            onDrop={(e) => { e.preventDefault(); onDrop(p.id); }}
                            onDragEnd={() => { setDragId(null); setOverId(null); }}
                            className={`border rounded-md bg-white p-2 flex flex-col cursor-move transition ${overId === p.id ? 'border-brand-500 ring-2 ring-brand-200' : 'border-gray-200'}`}
                        >
                            <div className="h-24 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.url} alt={p.alt_text ?? ''} className="h-full w-full object-cover" />
                            </div>

                            <div className="mt-2 space-y-1">
                                <p className="text-[11px] text-gray-700 truncate" title={fileNameOf(p.url)}>{fileNameOf(p.url)}</p>
                                <p className="text-[10px] text-gray-400">{uploadedAt(p.created_at)}</p>
                                <span className={p.is_primary ? 'badge-green' : 'badge-gray'}>
                                    {p.is_primary ? 'Cover' : `Photo ${p.display_order ?? i + 1}`}
                                </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                                {!p.is_primary && (
                                    <button type="button" disabled={busy} onClick={() => onSetCover(p.id)} className="text-brand-600 hover:text-brand-700 disabled:opacity-40">
                                        Set cover
                                    </button>
                                )}
                                <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} className="text-gray-600 hover:text-gray-900 disabled:opacity-30" title="Move up">↑</button>
                                <button type="button" disabled={busy || i === ordered.length - 1} onClick={() => move(i, 1)} className="text-gray-600 hover:text-gray-900 disabled:opacity-30" title="Move down">↓</button>
                                <button type="button" disabled={busy} onClick={() => onDelete(p)} className="text-red-600 hover:text-red-700 disabled:opacity-40">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
