/**
 * Admin Categories.
 */
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import db from '@/lib/db';
import CategoriesAdminClient from './CategoriesAdminClient';
import type { Category } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CategoriesAdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  const categories = await db.prepare('SELECT * FROM categories ORDER BY display_order, name_en').all() as Category[];
  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-1 mb-1">Categories</h1>
        <p className="text-gray-600 text-sm">{categories.length} categories</p>
      </div>
      <CategoriesAdminClient categories={categories} />
    </div>
  );
}
