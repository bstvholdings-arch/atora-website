import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import db from '@/lib/db';
import type { TechnicalPartner } from '@/lib/db';
import PartnersAdminClient from './PartnersAdminClient';

export const dynamic = 'force-dynamic';

export default async function PartnersAdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  const partners = db.prepare('SELECT * FROM technical_partners ORDER BY display_order, company_name_en').all() as TechnicalPartner[];
  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-1 mb-1">Technical Partners</h1>
        <p className="text-gray-600 text-sm">{partners.length} partners · Manage the companies in your partner network.</p>
      </div>
      <PartnersAdminClient partners={partners} />
    </div>
  );
}
