/**
 * Admin Brands — list with create / edit / delete.
 */
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import db from '@/lib/db';
import BrandsAdminClient from './BrandsAdminClient';
import type { Brand } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function BrandsAdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  const brands = db.prepare('SELECT * FROM brands ORDER BY display_order, name_en').all() as Brand[];
  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-1 mb-1">Brands</h1>
        <p className="text-gray-600 text-sm">{brands.length} brands · Manage the aircond brands you supply.</p>
      </div>
      <BrandsAdminClient brands={brands} />
    </div>
  );
}
