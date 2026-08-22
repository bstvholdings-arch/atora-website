/**
 * Logout endpoint — clears session and redirects to login.
 */
import { logoutAction } from '@/lib/actions';

export default function LogoutPage() {
  // Server form post triggers logoutAction
  return <form action={logoutAction} />;
}
