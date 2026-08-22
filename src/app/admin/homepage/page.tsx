/**
 * Admin — Homepage Content Editor. Manage dynamic homepage sections.
 */
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { data } from '@/lib/data';
import HomepageAdminClient from './HomepageAdminClient';

export const dynamic = 'force-dynamic';

export default async function HomepageAdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  const sections = await data.listHomepageSections();
  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-1 mb-1">Homepage Content</h1>
        <p className="text-gray-600 text-sm">Edit text, image and video for homepage dynamic sections.</p>
      </div>
      <HomepageAdminClient initialSections={sections} />
    </div>
  );
}
