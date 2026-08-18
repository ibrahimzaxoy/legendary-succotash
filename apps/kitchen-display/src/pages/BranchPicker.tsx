import { useEffect, useState } from 'react';
import { fetchBranches } from '../api/endpoints';
import type { Branch } from '../api/types';
import { setSession } from '../state/sessionStore';
import { LoadingScreen } from '../components/LoadingScreen';
import type { KdsSession } from '../utils/storage';

// Only reached when the signed-in staff member isn't tied to a single
// branch (owner/admin) - most kitchen displays are set up by a
// branch-scoped manager and skip straight to the station picker.
export function BranchPicker({ session }: { session: KdsSession }) {
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches(session.staff.restaurantId)
      .then(setBranches)
      .catch(() => setError('Couldn’t load branches.'));
  }, [session.staff.restaurantId]);

  if (error) return <div className="p-8 text-center text-error">{error}</div>;
  if (!branches) return <LoadingScreen label="Loading branches…" />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="mb-8 font-heading text-2xl font-bold">Which branch is this screen in?</h1>
      <div className="flex w-full max-w-sm flex-col gap-3">
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => setSession({ ...session, branchId: branch.id })}
            className="rounded-lg border border-border bg-card px-5 py-4 text-left text-lg font-medium active:bg-cardhover"
          >
            {branch.name}
          </button>
        ))}
        {branches.length === 0 && <p className="text-center text-muted">No branches yet.</p>}
      </div>
    </div>
  );
}
