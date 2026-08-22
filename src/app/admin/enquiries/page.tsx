import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import EnquiriesAdminClient from './EnquiriesAdminClient';
import { data } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function EnquiriesAdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  const enquiries = data.listAllEnquiries();
  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-1 mb-1">Customer Enquiries</h1>
        <p className="text-gray-600 text-sm">{enquiries.length} total · Manage incoming enquiries.</p>
      </div>
      <EnquiriesAdminClient enquiries={enquiries} />
    </div>
  );
}
