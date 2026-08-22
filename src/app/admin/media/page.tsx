/**
 * Admin — Media Library. Lists all uploaded files.
 */
import { redirect } from 'next/navigation';
import fs from 'node:fs';
import path from 'node:path';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');

export default async function MediaPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const exists = fs.existsSync(UPLOAD_DIR);
  const files = exists
    ? fs.readdirSync(UPLOAD_DIR)
        .filter((f) => f !== '.gitkeep')
        .map((f) => {
          const filePath = path.join(UPLOAD_DIR, f);
          const stat = fs.statSync(filePath);
          return {
            name: f,
            url: `/uploads/${f}`,
            size: stat.size,
            mtime: stat.mtime,
            type: /\.(jpe?g|png|webp)$/i.test(f) ? 'image' : 'video',
          };
        })
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-1 mb-1">Media Library</h1>
        <p className="text-gray-600 text-sm">{files.length} files · Located in <code className="text-brand-600">public/uploads</code></p>
      </div>

      {files.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          No media uploaded yet. Upload images or videos via Product / Brand / Location / Partner editors.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {files.map((f) => (
            <div key={f.name} className="card overflow-hidden">
              <div className="aspect-square bg-gray-50">
                {f.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={f.name} className="object-cover w-full h-full" />
                ) : (
                  <video src={f.url} className="object-cover w-full h-full" />
                )}
              </div>
              <div className="p-2 text-xs">
                <div className="font-mono truncate text-gray-700" title={f.name}>{f.name}</div>
                <div className="text-gray-500">{(f.size / 1024).toFixed(1)} KB · {f.type}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
