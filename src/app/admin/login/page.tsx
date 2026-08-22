/**
 * Admin login page.
 */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdmin } from '@/lib/auth';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Admin Login — ATORA',
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect('/admin/dashboard');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-2xl shadow-sm mb-3">
            A
          </div>
          <h1 className="text-2xl font-bold text-brand-800">ATORA Admin</h1>
          <p className="text-sm text-gray-500">Sign in to manage your site</p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-gray-500 mt-6">
          <Link href="/en" className="hover:text-brand-700">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}
