/**
 * Admin Products — list with create / edit / delete / duplicate.
 */
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { Product, Brand, Category } from '@/lib/db';
import { data } from '@/lib/data';
import ProductsAdminClient from './ProductsAdminClient';

export const dynamic = 'force-dynamic';

export default async function ProductsAdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const products = await db.prepare('SELECT * FROM products ORDER BY featured DESC, created_at DESC').all() as Product[];
  const brands = await data.listActiveBrands();
  const categories = await data.listActiveCategories();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-1 mb-1">Products</h1>
          <p className="text-gray-600 text-sm">{products.length} total · {products.filter((p) => p.status === 1).length} active</p>
        </div>
      </div>
      <ProductsAdminClient
        products={products}
        brands={brands}
        categories={categories}
      />
    </div>
  );
}
