import { useState, type FormEvent } from 'react';
import { fetchBranches, loginWithPassword } from '../api/endpoints';
import { ApiError } from '../api/client';
import { setDevice, setStaffSession } from '../state/store';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingScreen } from '../components/LoadingScreen';
import type { Branch } from '../api/types';

// One-time provisioning for a shared tablet: a manager/owner signs in to
// pick which branch this device belongs to, then their session is
// discarded - individual waiters sign in for their own shift afterwards
// via the PIN staff picker, not this screen.
export function DeviceSetup() {
  const [step, setStep] = useState<'login' | 'branch'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const tokens = await loginWithPassword(email, password);
      // Temporarily hold the manager's session just long enough to list
      // branches - it's discarded the moment a branch is picked below.
      setStaffSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, staff: tokens.staff });
      setRestaurantId(tokens.staff.restaurantId);
      const list = await fetchBranches(tokens.staff.restaurantId);
      setBranches(list);
      setStep('branch');
    } catch (err) {
      setStaffSession(null);
      setError(err instanceof ApiError ? err.message : 'Couldn’t reach the server. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const pickBranch = (branch: Branch) => {
    setDevice({ branchId: branch.id, branchName: branch.name });
    setStaffSession(null); // the manager's own session was only needed to get here
  };

  if (step === 'branch') {
    if (!branches) return <LoadingScreen label="Loading branches…" />;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <h1 className="mb-1 text-center font-heading text-2xl font-bold">Which branch is this tablet for?</h1>
        <p className="mb-8 text-center text-muted">You won’t need to do this again on this device.</p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => pickBranch(branch)}
              className="rounded-lg border border-border bg-card px-5 py-4 text-left text-lg font-medium active:bg-primary-light/40"
            >
              {branch.name}
            </button>
          ))}
          {branches.length === 0 && (
            <p className="text-center text-muted">
              No branches for restaurant {restaurantId.slice(0, 8)}… yet - add one from the Management Dashboard first.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center font-heading text-3xl font-bold">Waiter POS Setup</h1>
        <p className="mb-8 text-center text-muted">A manager or owner sets this tablet up once</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
            {submitting ? 'Signing in…' : 'Continue'}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
