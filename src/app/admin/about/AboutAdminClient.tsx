'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveAboutStoryAction } from '@/lib/actions';
import RichTextEditor from '@/components/RichTextEditor';
import AboutGalleryManager from './AboutGalleryManager';

type Lang = 'en' | 'bm' | 'zh';
const LANGS: { key: Lang; label: string }[] = [
    { key: 'en', label: 'English' },
    { key: 'bm', label: 'Bahasa' },
    { key: 'zh', label: '中文' },
];

function StoryEditor({
    initial,
}: {
    initial: {
        title_en?: string | null;
        title_bm?: string | null;
        title_zh?: string | null;
        body_en?: string | null;
        body_bm?: string | null;
        body_zh?: string | null;
    };
}) {
    const router = useRouter();
    const [lang, setLang] = useState<Lang>('en');
    const [titles, setTitles] = useState<Record<Lang, string>>({
        en: initial.title_en ?? '',
        bm: initial.title_bm ?? '',
        zh: initial.title_zh ?? '',
    });
    const [bodies, setBodies] = useState<Record<Lang, string>>({
        en: initial.body_en ?? '',
        bm: initial.body_bm ?? '',
        zh: initial.body_zh ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    async function onSave() {
        setSaving(true);
        setMsg(null);
        try {
            const fd = new FormData();
            fd.set('title_en', titles.en);
            fd.set('title_bm', titles.bm);
            fd.set('title_zh', titles.zh);
            fd.set('body_en', bodies.en);
            fd.set('body_bm', bodies.bm);
            fd.set('body_zh', bodies.zh);
            const res = await saveAboutStoryAction(fd);
            if (res.ok) {
                setMsg('Saved. The About page has been updated.');
                router.refresh();
            }
            else {
                setMsg(res.error ?? 'Save failed.');
            }
        }
        catch {
            setMsg('Save failed.');
        }
        finally {
            setSaving(false);
        }
    }

    return (
        <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h2 className="heading-2 mb-1">我们的故事 · Our Story</h2>
                    <p className="text-sm text-gray-500">Edit the title and rich-text body per language. Body can include images and videos.</p>
                </div>
                <button type="button" onClick={onSave} disabled={saving} className="btn-primary">
                    {saving ? 'Saving…' : 'Save Story'}
                </button>
            </div>

            {msg && <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">{msg}</p>}

            <div className="flex gap-1 border-b border-gray-200">
                {LANGS.map((l) => (
                    <button
                        key={l.key}
                        type="button"
                        onClick={() => setLang(l.key)}
                        className={`px-4 py-2 text-sm border-b-2 -mb-px ${lang === l.key ? 'border-brand-600 text-brand-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                    >
                        {l.label}
                    </button>
                ))}
            </div>

            <div>
                <label className="label">Title ({lang.toUpperCase()})</label>
                <input
                    className="input"
                    value={titles[lang]}
                    onChange={(e) => setTitles((prev) => ({ ...prev, [lang]: e.target.value }))}
                    placeholder="e.g. Our Story"
                />
            </div>
            <div>
                <label className="label">Body ({lang.toUpperCase()})</label>
                <RichTextEditor value={bodies[lang]} onChange={(html) => setBodies((prev) => ({ ...prev, [lang]: html }))} placeholder="Write the story… use the toolbar to add headings, lists, links, images and videos." />
            </div>
        </div>
    );
}

export default function AboutAdminClient({ initial }: { initial: NonNullable<unknown> }) {
    const story = initial as {
        title_en?: string | null;
        title_bm?: string | null;
        title_zh?: string | null;
        body_en?: string | null;
        body_bm?: string | null;
        body_zh?: string | null;
    };
    return (
        <div className="space-y-6">
            <StoryEditor initial={story} />
            <AboutGalleryManager />
        </div>
    );
}
