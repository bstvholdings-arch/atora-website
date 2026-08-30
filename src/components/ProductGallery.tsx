'use client';

/**
 * ProductGallery — front-end gallery on the product detail page.
 * Reads from product_media: the cover (is_primary = 1) is shown first,
 * remaining photos follow display_order. Supports images and videos.
 */
import { useState } from 'react';
import type { ProductMedia } from '@/lib/db';

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
            <div className="aspect-square bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
                No image
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
