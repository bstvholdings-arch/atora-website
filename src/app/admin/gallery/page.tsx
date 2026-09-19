/**
 * /admin/gallery — 相册管理 (About Us photo wall / album).
 */
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { data } from '@/lib/data';
import GalleryAdminClient from './GalleryAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminGalleryPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const photos = await data.listAllGallery();

  return <GalleryAdminClient initialPhotos={photos} />;
}
