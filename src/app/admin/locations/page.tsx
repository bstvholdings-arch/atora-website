/**
 * Admin Locations.
 */
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import db from '@/lib/db';
import type { Location } from '@/lib/db';
import LocationsAdminClient from './LocationsAdminClient';

export const dynamic = 'force-dynamic';

export default async function LocationsAdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  const locations = db.prepare('SELECT * FROM locations ORDER BY display_order, name_en').all() as Location[];
  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-1 mb-1">Locations</h1>
        <p className="text-gray-600 text-sm">{locations.length} locations · HQ, branches and warehouses.</p>
      </div>
      <LocationsAdminClient locations={locations} />
    </div>
  );
}
