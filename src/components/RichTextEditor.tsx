'use client';

/**
 * RichTextEditor — a dependency-free WYSIWYG built on contentEditable + execCommand.
 * Chosen over CKEditor/TinyMCE because those need CDN/API keys and bloat the
 * Vercel bundle; this keeps the editor fully self-contained and SSR-safe.
 *
 * Produces HTML (the About page renders it via dangerouslySetInnerHTML).
 * Supports bold / italic / underline / headings / lists / links / inline image upload / video embed.
 */
import { useEffect, useRef } from 'react';

type Props = {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: number;
};

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 220 }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Initialise once on mount so React never clobbers the caret.
    useEffect(() => {
        if (ref.current && ref.current.innerHTML !== (value ?? '')) {
            ref.current.innerHTML = value || '';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function emit() {
        if (ref.current)
            onChangeRef.current(ref.current.innerHTML);
    }

    function exec(command: string, arg?: string) {
        ref.current?.focus();
        document.execCommand(command, false, arg);
        emit();
    }

    async function insertImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/gif,image/webp';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file)
                return;
            const fd = new FormData();
            fd.append('file', file);
            fd.append('kind', 'photo');
            try {
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.ok)
                    exec('insertImage', data.url as string);
                else
                    alert(typeof data.error === 'string' ? data.error : 'Upload failed');
            }
            catch {
                alert('Image upload failed');
            }
        };
        input.click();
    }

    function insertVideo() {
        const url = window.prompt('Paste a video URL (mp4 / webm / YouTube embed):');
        if (!url)
            return;
        const html = url.includes('youtube')
            ? `<div><iframe src="${url}" class="rte-video" allowfullscreen></iframe></div>`
            : `<div><video src="${url}" class="rte-video" controls></video></div>`;
        ref.current?.focus();
        document.execCommand('insertHTML', false, html);
        emit();
    }

    const btn =
    'px-2.5 py-1 rounded text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 border border-transparent hover:border-brand-200';

    return (
        <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
            <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
                <button type="button" className={btn} title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}><b>B</b></button>
                <button type="button" className={btn} title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}><i>I</i></button>
                <button type="button" className={btn} title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')}><u>U</u></button>
                <span className="w-px h-5 bg-gray-300 mx-1" />
                <button type="button" className={btn} title="Heading" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'H2')}>H2</button>
                <button type="button" className={btn} title="Subheading" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'H3')}>H3</button>
                <button type="button" className={btn} title="Paragraph" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'P')}>¶</button>
                <span className="w-px h-5 bg-gray-300 mx-1" />
                <button type="button" className={btn} title="Bulleted list" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}>• List</button>
                <button type="button" className={btn} title="Numbered list" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')}>1. List</button>
                <span className="w-px h-5 bg-gray-300 mx-1" />
                <button type="button" className={btn} title="Insert link" onMouseDown={(e) => e.preventDefault()} onClick={() => {
                    const u = window.prompt('Link URL:');
                    if (u)
                        exec('createLink', u);
                }}>🔗 Link</button>
                <button type="button" className={btn} title="Insert image" onMouseDown={(e) => e.preventDefault()} onClick={insertImage}>🖼 Image</button>
                <button type="button" className={btn} title="Insert video" onMouseDown={(e) => e.preventDefault()} onClick={insertVideo}>🎬 Video</button>
                <span className="w-px h-5 bg-gray-300 mx-1" />
                <button type="button" className={btn} title="Clear formatting" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('removeFormat')}>⌫ Clear</button>
            </div>
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                data-placeholder={placeholder}
                onInput={emit}
                onBlur={emit}
                className="px-3 py-2 text-sm text-gray-800 leading-relaxed focus:outline-none rte-content"
                style={{ minHeight }}
            />
            <style>{`
        .rte-content:empty:before { content: attr(data-placeholder); color: #9ca3af; }
        .rte-content img { max-width: 100%; height: auto; border-radius: 6px; margin: 4px 0; }
        .rte-content .rte-video { width: 100%; max-width: 560px; aspect-ratio: 16/9; border: 0; border-radius: 6px; }
        .rte-content h2 { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.35rem; }
        .rte-content h3 { font-size: 1.1rem; font-weight: 600; margin: 0.6rem 0 0.3rem; }
        .rte-content ul { list-style: disc; padding-left: 1.4rem; }
        .rte-content ol { list-style: decimal; padding-left: 1.4rem; }
        .rte-content a { color: #0f766e; text-decoration: underline; }
      `}</style>
        </div>
    );
}
