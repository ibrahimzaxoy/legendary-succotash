import { useEffect, useState } from 'react';
import { createStaff, fetchStaff } from '../api/endpoints';
import { ApiError } from '../api/client';
import { Modal } from '../components/Modal';
import { LoadingScreen } from '../components/LoadingScreen';
import type { Role, Staff } from '../api/types';

// Deliberately excludes owner/admin - granting those from this form would
// be a privilege escalation path for whoever's using it (even a manager
// account can reach this screen). Minting an owner/admin is a separate,
// more deliberate action outside this dashboard for now.
const ASSIGNABLE_ROLES: Role[] = ['manager', 'waiter', 'cashier', 'kitchen', 'rider'];
const PIN_ROLES: Role[] = ['waiter', 'cashier', 'kitchen', 'rider'];

export function StaffPage({ restaurantId, branchId }: { restaurantId: string; branchId: string }) {
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => fetchStaff(branchId).then(setStaff);
  useEffect(() => {
    setStaff(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  if (!staff) return <LoadingScreen label="Loading staff…" />;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Staff</h1>
        <button onClick={() => setShowCreate(true)} className="rounded bg-primary px-4 py-2 font-medium text-white">
          + Add staff
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{s.fullName}</td>
                <td className="px-4 py-3 capitalize">{s.role}</td>
                <td className="px-4 py-3 text-muted">{s.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${s.active ? 'bg-success/10 text-success' : 'bg-stone-200 text-muted'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  No staff added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateStaffModal
          restaurantId={restaurantId}
          branchId={branchId}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateStaffModal({
  restaurantId,
  branchId,
  onClose,
  onCreated,
}: {
  restaurantId: string;
  branchId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('waiter');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const usesPin = PIN_ROLES.includes(role);
  const canSubmit = fullName.trim() && email.trim() && (usesPin ? pin.trim().length >= 4 : password.trim().length >= 6);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createStaff({
        restaurantId,
        branchId,
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        password: usesPin ? undefined : password,
        pin: usesPin ? pin : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t add this staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add staff" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded border border-border p-2.5" />
        </label>
        <label className="text-sm font-medium">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded border border-border p-2.5" />
        </label>
        <label className="text-sm font-medium">
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 w-full rounded border border-border p-2.5 capitalize">
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </select>
        </label>
        {usesPin ? (
          <label className="text-sm font-medium">
            PIN (for shared-tablet login)
            <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4+ digits" className="mt-1 w-full rounded border border-border p-2.5" />
          </label>
        ) : (
          <label className="text-sm font-medium">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6+ characters"
              className="mt-1 w-full rounded border border-border p-2.5"
            />
          </label>
        )}
        {error && <p className="text-sm text-error">{error}</p>}
        <button onClick={submit} disabled={!canSubmit || submitting} className="mt-2 rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40">
          {submitting ? 'Adding…' : 'Add staff member'}
        </button>
      </div>
    </Modal>
  );
}
