'use client';

/**
 * ProductGallery — front-end gallery on the product detail page.
 * Reads from product_media: the cover (is_primary = 1) is shown first,
 * remaining photos follow display_order. Supports images and videos.
 */
import { useState } from 'react';
import type { ProductMedia } from '@/lib/db';

// Self-contained placeholder shown when a product has no images.
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='400'%20height='400'%3E%3Crect%20width='100%25'%20height='100%25'%20fill='%23f3f4f6'/%3E%3Cg%20fill='none'%20stroke='%23cbd5e1'%20stroke-width='14'%3E%3Crect%20x='120'%20y='130'%20width='160'%20height='140'%20rx='10'/%3E%3Ccircle%20cx='165'%20cy='180'%20r='18'/%3E%3Cpath%20d='M128%20260%20l46%20-46%2036%2036%2028%20-28%2050%2050'/%3E%3C/g%3E%3C/svg%3E";

export default function ProductGallery({ media, name }: { media: ProductMedia[]; name: string }) {
    // Cover first, then display_order.
    const ordered = [...media].sort((a, b) => {
        if (!!b.is_primary !== !!a.is_primary)
            return (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0);
        return (a.display_order ?? 0) - (b.display_order ?? 0) || a.id - b.id;
    });

    const [active, setActive] = useState(0);

    if (ordered.length === 0) {
        return (
            <div className="aspect-square bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PLACEHOLDER_IMAGE} alt="No image available" className="object-cover w-full h-full opacity-90" />
            </div>
        );
    }

    const current = ordered[Math.min(active, ordered.length - 1)];
    const go = (delta: number) => setActive((i) => (i + delta + ordered.length) % ordered.length);

    return (
        <div>
            <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                {current.type === 'video' ? (
                    <video src={current.url} controls className="object-contain w-full h-full bg-black" />
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={current.url} alt={current.alt_text || name} className="object-contain w-full h-full" />
                )}

                {ordered.length > 1 && (
                    <>
                        <button
                            type="button"
                            aria-label="Previous image"
                            onClick={() => go(-1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 hover:bg-white shadow text-gray-700"
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            aria-label="Next image"
                            onClick={() => go(1)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 hover:bg-white shadow text-gray-700"
                        >
                            ›
                        </button>
                        <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white rounded px-2 py-0.5">
                            {Math.min(active, ordered.length - 1) + 1} / {ordered.length}
                        </span>
                    </>
                )}

                {current.is_primary === 1 && (
                    <span className="absolute top-2 left-2 badge-green">Cover</span>
                )}
            </div>

            {ordered.length > 1 && (
                <div className="grid grid-cols-5 gap-2 mt-3">
                    {ordered.map((m, i) => (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => setActive(i)}
                            aria-label={`Show image ${i + 1}`}
                            className={`aspect-square rounded overflow-hidden border transition ${i === Math.min(active, ordered.length - 1)
                                ? 'border-brand-600 ring-2 ring-brand-200'
                                : 'border-gray-200 hover:border-brand-400'}`}
                        >
                            {m.type === 'video' ? (
                                <video src={m.url} className="object-cover w-full h-full" muted />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.url} alt={m.alt_text || name} className="object-cover w-full h-full" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
