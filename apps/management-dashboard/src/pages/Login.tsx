import { useState, type FormEvent } from 'react';
import { login } from '../api/endpoints';
import { ApiError } from '../api/client';
import { setSession } from '../state/store';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const tokens = await login(email, password);
      if (!['owner', 'admin', 'manager'].includes(tokens.staff.role)) {
        setError('This account doesn’t have management access.');
        return;
      }
      setSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, staff: tokens.staff });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center font-heading text-2xl font-bold">Management Dashboard</h1>
        <p className="mb-8 text-center text-muted">Owner, admin, and manager access</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            className="rounded border border-border bg-card px-4 py-3 outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="rounded border border-border bg-card px-4 py-3 outline-none focus:border-primary"
          />
          {error && <p className="text-center text-sm text-error">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-primary py-3 font-semibold text-white disabled:opacity-40"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
