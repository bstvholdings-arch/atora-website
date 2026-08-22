/**
 * Admin dashboard — overview counts + recent activity.
 */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdmin } from '@/lib/auth';
import { data } from '@/lib/data';

export default async function DashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const counts = await data.counts();
  const recentEnquiries = (await data.listAllEnquiries()).slice(0, 8);

  return (
    <div>
      <h1 className="heading-1 mb-1">Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome back, {admin.name || admin.email}.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Products" value={counts.products} accent="brand" href="/admin/products" />
        <StatCard label="Brands" value={counts.brands} accent="brand" href="/admin/brands" />
        <StatCard label="Categories" value={counts.categories} accent="brand" href="/admin/categories" />
        <StatCard label="Enquiries" value={counts.enquiries} accent="green" href="/admin/enquiries" />
        <StatCard label="Partners" value={counts.partners} accent="brand" href="/admin/partners" />
        <StatCard label="Locations" value={counts.locations} accent="brand" href="/admin/locations" />
        <StatCard label="Featured Products" value={counts.featuredProducts} accent="yellow" href="/admin/products" />
        <StatCard label="Featured Partners" value={counts.featuredPartners} accent="yellow" href="/admin/partners" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-brand-800">Recent Enquiries</h2>
            <Link href="/admin/enquiries" className="text-sm text-brand-600 hover:text-brand-700">View all →</Link>
          </div>
          {recentEnquiries.length === 0 ? (
            <p className="text-sm text-gray-500">No enquiries yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="py-2 pr-2">Name</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2">Brand/Model</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentEnquiries.map((e) => (
                  <tr key={e.id} className="border-t border-gray-100">
                    <td className="py-2 pr-2 font-medium text-brand-700">{e.name ?? '—'}</td>
                    <td className="py-2 pr-2 text-gray-600">{e.type}</td>
                    <td className="py-2 pr-2 text-gray-600">
                      {[e.brand, e.model].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="py-2 pr-2">
                      <span className={`badge ${statusClass(e.status)}`}>{e.status}</span>
                    </td>
                    <td className="py-2 text-gray-500 text-xs">{e.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-brand-800 mb-4">Quick Actions</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/admin/products" className="block px-3 py-2 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700">+ Add Product</Link></li>
            <li><Link href="/admin/brands" className="block px-3 py-2 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700">+ Add Brand</Link></li>
            <li><Link href="/admin/locations" className="block px-3 py-2 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700">+ Add Location</Link></li>
            <li><Link href="/admin/partners" className="block px-3 py-2 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700">+ Add Partner</Link></li>
            <li><Link href="/admin/faqs" className="block px-3 py-2 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700">+ Add FAQ</Link></li>
            <li><Link href="/admin/settings" className="block px-3 py-2 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700">⚙ Site Settings</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, href }: { label: string; value: number; accent: 'brand' | 'green' | 'yellow'; href: string }) {
  const cls =
    accent === 'green'
      ? 'bg-green-50 text-green-700'
      : accent === 'yellow'
        ? 'bg-yellow-50 text-yellow-700'
        : 'bg-brand-50 text-brand-700';
  return (
    <Link href={href} className="card p-4 hover:shadow-md transition">
      <div className={`inline-block px-2 py-0.5 rounded text-xs ${cls} mb-1`}>{label}</div>
      <div className="text-3xl font-bold text-brand-800">{value}</div>
    </Link>
  );
}

function statusClass(status: string): string {
  switch (status) {
    case 'NEW': return 'badge-blue';
    case 'CONTACTED': return 'badge-yellow';
    case 'QUOTED': return 'badge-green';
    case 'COMPLETED': return 'badge-green';
    case 'CANCELLED': return 'badge-gray';
    default: return 'badge-gray';
  }
}
