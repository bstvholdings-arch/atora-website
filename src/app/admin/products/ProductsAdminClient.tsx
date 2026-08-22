'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, Brand, Category, ProductMedia } from '@/lib/db';
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  duplicateProductAction,
  addProductMediaAction,
  deleteProductMediaAction,
  setPrimaryMediaAction,
  getProductMediaAction,
} from '@/lib/actions';
import MediaUploader from '@/components/MediaUploader';

const PRICE_MODES = [
  { value: 'SHOW_PRICE', label: 'Show Price' },
  { value: 'SHOW_WHOLESALE_PRICE', label: 'Show Wholesale Price' },
  { value: 'SHOW_PROMOTION_PRICE', label: 'Show Promotion Price' },
  { value: 'SHOW_PRICE_RANGE', label: 'Show Price Range' },
  { value: 'CONTACT_FOR_PRICE', label: 'Contact for Price' },
];

const STOCK_STATUSES = ['in_stock', 'low_stock', 'out_of_stock'];

export default function ProductsAdminClient({
  products,
  brands,
  categories,
}: {
  products: Product[];
  brands: Brand[];
  categories: Category[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name_en.toLowerCase().includes(q) ||
      (p.name_bm ?? '').toLowerCase().includes(q) ||
      (p.name_zh ?? '').toLowerCase().includes(q) ||
      (p.model ?? '').toLowerCase().includes(q) ||
      (p.sku ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, model, SKU…"
          className="input max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => setCreating(true)} className="btn-primary ml-auto">+ Add Product</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Brand</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Featured</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">No products found</td></tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-brand-700">
                    <div className="line-clamp-1">{p.name_en}</div>
                    {p.model && <div className="text-xs text-gray-500">{p.model}</div>}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{brands.find((b) => b.id === p.brand_id)?.name_en ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{categories.find((c) => c.id === p.category_id)?.name_en ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-700">{p.retail_price ? `RM ${p.retail_price}` : <span className="text-gray-400">—</span>}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{p.price_display_mode}</td>
                  <td className="px-3 py-2">
                    <span className={p.status === 1 ? 'badge-green' : 'badge-gray'}>{p.status === 1 ? 'Active' : 'Hidden'}</span>
                  </td>
                  <td className="px-3 py-2">{p.featured === 1 ? '⭐' : '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(p)} className="text-xs text-brand-600 hover:text-brand-700">Edit</button>
                      <form action={async (fd) => { await duplicateProductAction(p.id); router.refresh(); }}>
                        <button className="text-xs text-blue-600 hover:text-blue-700">Duplicate</button>
                      </form>
                      <form action={async (fd) => { await deleteProductAction(p.id); router.refresh(); }}>
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
        <ProductFormModal
          product={editing}
          brands={brands}
          categories={categories}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); router.refresh(); }}
        />
      )}
    </>
  );
}

function ProductFormModal({
  product,
  brands,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null;
  brands: Brand[];
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(product);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      if (isEdit && product) await updateProductAction(product.id, fd);
      else await createProductAction(fd);
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  const p = product;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h2 className="font-bold text-brand-800">{isEdit ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <input type="hidden" name="slug" value={p?.slug ?? ''} />

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="label">Name (English)</label>
              <input name="name_en" required defaultValue={p?.name_en ?? ''} className="input" />
            </div>
            <div>
              <label className="label">Name (Bahasa)</label>
              <input name="name_bm" defaultValue={p?.name_bm ?? ''} className="input" />
            </div>
            <div>
              <label className="label">Name (Chinese)</label>
              <input name="name_zh" defaultValue={p?.name_zh ?? ''} className="input" />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="label">SKU</label>
              <input name="sku" defaultValue={p?.sku ?? ''} className="input" />
            </div>
            <div>
              <label className="label">Brand</label>
              <select name="brand_id" defaultValue={p?.brand_id ?? ''} className="input">
                <option value="">— Select —</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name_en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select name="category_id" defaultValue={p?.category_id ?? ''} className="input">
                <option value="">— Select —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Model</label>
              <input name="model" defaultValue={p?.model ?? ''} className="input" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="label">Capacity</label>
              <input name="capacity" defaultValue={p?.capacity ?? ''} className="input" placeholder='e.g. 1.5HP / 12000 BTU' />
            </div>
            <div>
              <label className="label">Product Type</label>
              <input name="product_type" defaultValue={p?.product_type ?? ''} className="input" placeholder='e.g. Inverter, Split Unit' />
            </div>
            <div>
              <label className="label">Stock Status</label>
              <select name="stock_status" defaultValue={p?.stock_status ?? 'in_stock'} className="input">
                {STOCK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="label">Description (EN)</label>
              <textarea name="description_en" rows={4} defaultValue={p?.description_en ?? ''} className="input" />
            </div>
            <div>
              <label className="label">Description (BM)</label>
              <textarea name="description_bm" rows={4} defaultValue={p?.description_bm ?? ''} className="input" />
            </div>
            <div>
              <label className="label">Description (ZH)</label>
              <textarea name="description_zh" rows={4} defaultValue={p?.description_zh ?? ''} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Specifications</label>
            <textarea name="specifications" rows={3} defaultValue={p?.specifications ?? ''} className="input" placeholder="Power, dimensions, weight, etc." />
          </div>

          {/* Pricing */}
          <div className="rounded-md bg-brand-50/50 p-4 space-y-3">
            <h3 className="font-semibold text-brand-800">Pricing</h3>
            <div className="grid md:grid-cols-5 gap-3">
              <div>
                <label className="label">Retail Price</label>
                <input type="number" step="0.01" name="retail_price" defaultValue={p?.retail_price ?? ''} className="input" />
              </div>
              <div>
                <label className="label">Wholesale</label>
                <input type="number" step="0.01" name="wholesale_price" defaultValue={p?.wholesale_price ?? ''} className="input" />
              </div>
              <div>
                <label className="label">Promotion</label>
                <input type="number" step="0.01" name="promotion_price" defaultValue={p?.promotion_price ?? ''} className="input" />
              </div>
              <div>
                <label className="label">Price Min</label>
                <input type="number" step="0.01" name="price_min" defaultValue={p?.price_min ?? ''} className="input" />
              </div>
              <div>
                <label className="label">Price Max</label>
                <input type="number" step="0.01" name="price_max" defaultValue={p?.price_max ?? ''} className="input" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">Currency</label>
                <input name="currency" defaultValue={p?.currency ?? 'RM'} className="input" />
              </div>
              <div>
                <label className="label">Price Display Mode</label>
                <select name="price_display_mode" defaultValue={p?.price_display_mode ?? 'SHOW_PRICE'} className="input">
                  {PRICE_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* SEO */}
          <details className="rounded-md border border-gray-200 p-3">
            <summary className="font-medium text-brand-700 cursor-pointer">SEO Metadata</summary>
            <div className="space-y-3 mt-3">
              <div>
                <label className="label">SEO Title (EN)</label>
                <input name="seo_title_en" defaultValue={p?.seo_title_en ?? ''} className="input" />
              </div>
              <div>
                <label className="label">SEO Description (EN)</label>
                <textarea name="seo_description_en" rows={2} defaultValue={p?.seo_description_en ?? ''} className="input" />
              </div>
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={p?.featured === 1} className="rounded border-gray-300" />
              Featured
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="status" defaultChecked={p?.status !== 0} className="rounded border-gray-300" />
              Active
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>

        {isEdit && product && (
          <div className="p-6 border-t border-gray-200">
            <ProductMediaManager productId={product.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function ProductMediaManager({ productId }: { productId: number }) {
  const router = useRouter();
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [kind, setKind] = useState<'image' | 'video'>('image');
  const [uploadKey, setUploadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    setMedia(await getProductMediaAction(productId));
  }
  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [productId]);

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData(e.currentTarget);
      await addProductMediaAction(productId, fd);
      await reload();
      router.refresh();
      setUploadKey((k) => k + 1);
      e.currentTarget.reset();
      setKind('image');
    } catch {
      setMsg('Failed to add media.');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    await deleteProductMediaAction(id);
    await reload();
    router.refresh();
  }

  async function onPrimary(id: number) {
    await setPrimaryMediaAction(id, productId);
    await reload();
    router.refresh();
  }

  return (
    <div className="rounded-md bg-gray-50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-brand-800">Media — Photos &amp; Videos</h3>
        <span className="text-xs text-gray-500">{media.length} item(s)</span>
      </div>

      {msg && <p className="text-xs text-red-600">{msg}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {media.map((m) => (
          <div key={m.id} className="border rounded-md bg-white p-2 flex flex-col">
            <div className="h-24 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              {m.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.alt_text ?? ''} className="h-full w-full object-cover" />
              ) : (
                <video src={m.url} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={m.is_primary ? 'badge-green' : 'badge-gray'}>
                {m.is_primary ? 'Primary' : m.type}
              </span>
              <div className="flex gap-2">
                {!m.is_primary && (
                  <button type="button" onClick={() => onPrimary(m.id)} className="text-brand-600 hover:text-brand-700">
                    Set primary
                  </button>
                )}
                <button type="button" onClick={() => onDelete(m.id)} className="text-red-600 hover:text-red-700">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {media.length === 0 && <p className="text-xs text-gray-500 col-span-full">No media uploaded yet.</p>}
      </div>

      <form onSubmit={onAdd} className="space-y-3 border-t border-gray-200 pt-3">
        <p className="text-sm font-medium text-brand-700">Add media</p>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="label">Type</label>
            <select className="input" value={kind} onChange={(e) => { setKind(e.target.value as 'image' | 'video'); setUploadKey((k) => k + 1); }}>
              <option value="image">Image (JPG/PNG/WEBP)</option>
              <option value="video">Video (MP4/MOV/WEBM)</option>
            </select>
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="label">Upload file</label>
            <MediaUploader key={uploadKey} kind={kind} name="url" />
          </div>
        </div>
        <input type="hidden" name="type" value={kind} />
        <div className="grid md:grid-cols-2 gap-3 items-end">
          <div>
            <label className="label">Alt text</label>
            <input name="alt_text" className="input" placeholder="Describe the image for accessibility/SEO" />
          </div>
          <label className="inline-flex items-center gap-2 text-sm pb-2">
            <input type="checkbox" name="is_primary" className="rounded border-gray-300" />
            Set as primary image
          </label>
        </div>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Adding…' : 'Add Media'}
        </button>
      </form>
    </div>
  );
}
