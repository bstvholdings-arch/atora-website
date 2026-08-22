/**
 * Admin — Site Settings. Edits all keys in site_settings table.
 */
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { getAllSettings } from '@/lib/settings';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  const settings = getAllSettings();
  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-1 mb-1">Site Settings</h1>
        <p className="text-gray-600 text-sm">Company information, contact, SEO defaults and footer content.</p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
