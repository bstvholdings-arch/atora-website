/**
 * /admin/comments — 留言管理 (comment moderation).
 * Only approved comments are visible on the public About page.
 */
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { data } from '@/lib/data';
import CommentsAdminClient from './CommentsAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminCommentsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  // Load everything once; the client filters by status locally and re-queries
  // the server only when searching.
  const comments = await data.listComments({ status: 'all' });

  return <CommentsAdminClient initialComments={comments} />;
}
