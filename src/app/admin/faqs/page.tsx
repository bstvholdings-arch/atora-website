/**
 * Admin FAQs — short editor with EN/BM/ZH fields.
 */
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import db from '@/lib/db';
import type { FAQ } from '@/lib/db';
import FaqsAdminClient from './FaqsAdminClient';

export const dynamic = 'force-dynamic';

export default async function FaqsAdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  const faqs = await db.prepare('SELECT * FROM faqs ORDER BY display_order, id').all() as FAQ[];
  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-1 mb-1">FAQs</h1>
        <p className="text-gray-600 text-sm">{faqs.length} questions · Multilingual FAQ database.</p>
      </div>
      <FaqsAdminClient faqs={faqs} />
    </div>
  );
}
