/**
 * /admin/awards — 奖项管理 (Awards).
 * Awards & medals shown on the public About Us page.
 */
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { data } from '@/lib/data';
import AwardsAdminClient from './AwardsAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminAwardsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const awards = await data.listAllAwards();

  return <AwardsAdminClient initialAwards={awards} />;
}
