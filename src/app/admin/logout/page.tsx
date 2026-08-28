/**
 * Logout page.
 * Invoked directly (deep link / POST to /admin/logout) or as the
 * fallback target — clears the session and redirects to the login page.
 * The sidebar Logout button in layout.tsx calls logoutAction directly,
 * but this page guarantees any direct navigation also logs the user out.
 */
import { logoutAction } from '@/lib/actions';

export default async function LogoutPage() {
  await logoutAction();
  return null;
}
