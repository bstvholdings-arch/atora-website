'use client';

import { useState, useTransition } from 'react';
import { changePasswordAction } from '@/lib/actions';

export default function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (result.ok) {
        setSuccess(true);
        e.currentTarget.reset();
      } else {
        setError(result.error ?? 'Failed to change password.');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <div>
        <label className="label">Current Password</label>
        <input
          type="password"
          name="current_password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>
      <div>
        <label className="label">New Password</label>
        <input
          type="password"
          name="new_password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
        />
        <p className="text-xs text-gray-500 mt-1">At least 8 characters.</p>
      </div>
      <div>
        <label className="label">Confirm New Password</label>
        <input
          type="password"
          name="confirm_password"
          required
          autoComplete="new-password"
          className="input"
        />
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>}
      {success && (
        <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
          Password changed successfully.
        </div>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Saving…' : 'Change Password'}
      </button>
    </form>
  );
}
