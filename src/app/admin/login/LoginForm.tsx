'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/lib/actions';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.ok) {
        router.push('/admin/dashboard');
      } else {
        setError(result.error ?? 'Invalid email or password.');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <div>
        <label className="label">Email</label>
        <input
          type="email"
          name="email"
          required
          autoFocus
          autoComplete="email"
          defaultValue="admin@atora.com.my"
          className="input"
        />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Signing in…' : 'Sign In'}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Default: admin@atora.com.my / Atora@2026 (change after first login)
      </p>
    </form>
  );
}
