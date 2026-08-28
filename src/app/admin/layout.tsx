/**
 * Admin layout — sidebar navigation. Applied to all /admin/* pages.
 * Login page is exempt via its own layout.
 */
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { data } from '@/lib/data';
import { getAllSettings } from '@/lib/settings';
import { logoutAction } from '@/lib/actions';
import Link from 'next/link';

export const metadata = {
  title: 'Admin — ATORA',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Allow /admin/login to render without auth
  // The login page sets its own metadata; here we just check the rest.
  const admin = await getCurrentAdmin();
  if (!admin) {
    // Rely on inner page / route guards. This avoids redirect loops.
    return <>{children}</>;
  }

  const counts = await data.counts();
  const settings = await getAllSettings();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-brand-700">
            <div className="h-8 w-8 rounded-md bg-brand-600 text-white flex items-center justify-center font-bold">A</div>
            <div>
              <div className="text-sm leading-tight">ATORA Admin</div>
              <div className="text-[10px] text-gray-500 leading-tight">{settings.company_name_en}</div>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-gray-600">{admin.name || admin.email}</span>
            <Link href="/en" target="_blank" className="text-brand-600 hover:text-brand-700 hidden sm:inline">View Site ↗</Link>
            <form action={logoutAction}>
              <button type="submit" className="text-red-600 hover:text-red-700">Logout</button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:block w-60 bg-white border-r border-gray-200 min-h-[calc(100vh-56px)] sticky top-14">
          <nav className="py-4 px-3 space-y-1 text-sm">
            <NavSection title="Overview">
              <NavLink href="/admin/dashboard" label="Dashboard" />
            </NavSection>
            <NavSection title="Catalogue">
              <NavLink href="/admin/products" label={`Products (${counts.products})`} />
              <NavLink href="/admin/brands" label={`Brands (${counts.brands})`} />
              <NavLink href="/admin/categories" label={`Categories (${counts.categories})`} />
            </NavSection>
            <NavSection title="Sales">
              <NavLink href="/admin/enquiries" label={`Enquiries (${counts.enquiries})`} />
              <NavLink href="/admin/partners" label={`Partners (${counts.partners})`} />
            </NavSection>
            <NavSection title="Locations & Content">
              <NavLink href="/admin/locations" label={`Locations (${counts.locations})`} />
              <NavLink href="/admin/homepage" label="Homepage Content" />
              <NavLink href="/admin/faqs" label="FAQs" />
            </NavSection>
            <NavSection title="Configuration">
              <NavLink href="/admin/media" label="Media Library" />
              <NavLink href="/admin/settings" label="Settings" />
            </NavSection>
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full">{children}</main>
      </div>
    </div>
  );
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-3 pb-1">
      <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block px-3 py-2 rounded-md text-gray-700 hover:bg-brand-50 hover:text-brand-700">
      {label}
    </Link>
  );
}
