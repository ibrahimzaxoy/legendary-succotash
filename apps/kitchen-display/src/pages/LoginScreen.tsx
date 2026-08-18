import { useState, type FormEvent } from 'react';
import { login } from '../api/endpoints';
import { ApiError } from '../api/client';
import { setSession } from '../state/sessionStore';
import { PrimaryButton } from '../components/PrimaryButton';

// Kitchen displays are set up once (typically by a manager/owner) and then
// stay signed in for the life of the device - this screen is the exception,
// not something kitchen staff see during service.
export function LoginScreen() {
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
      setSession({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        staff: tokens.staff,
        branchId: tokens.staff.branchId ?? '',
        stationId: null,
        stationName: null,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t reach the server. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center font-heading text-3xl font-bold">Kitchen Display</h1>
        <p className="mb-8 text-center text-muted">Sign in to set up this screen</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            className="rounded-lg border border-border bg-card px-4 py-3.5 text-lg text-ink outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="rounded-lg border border-border bg-card px-4 py-3.5 text-lg text-ink outline-none focus:border-primary"
          />
          {error && <p className="text-center text-error">{error}</p>}
          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
