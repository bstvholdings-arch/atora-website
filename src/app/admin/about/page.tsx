/**
 * /admin/about — manage "Our Story" (rich text) and the About photo gallery.
 */
import { data } from '@/lib/data';
import AboutAdminClient from './AboutAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminAboutPage() {
    const story = await data.getAboutStory();
    return (
        <div>
            <div className="mb-6">
                <h1 className="heading-1">About Us · 关于我们</h1>
                <p className="text-sm text-gray-500">Edit the story content and manage the photo gallery shown on the public About page.</p>
            </div>
            <AboutAdminClient
                initial={{
                    title_en: story?.title_en ?? null,
                    title_bm: story?.title_bm ?? null,
                    title_zh: story?.title_zh ?? null,
                    body_en: story?.body_en ?? null,
                    body_bm: story?.body_bm ?? null,
                    body_zh: story?.body_zh ?? null,
                }}
            />
        </div>
    );
}
