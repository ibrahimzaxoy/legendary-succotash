import { useEffect, useState } from 'react';
import {
  clockIn,
  clockOut,
  closeCashDrawer,
  fetchMyOpenAttendance,
  fetchMyOpenCashDrawer,
  openCashDrawer,
} from '../api/endpoints';
import { ApiError } from '../api/client';
import { Header } from '../components/Header';
import { LoadingScreen } from '../components/LoadingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { formatMoney } from '../utils/money';
import type { Device, StaffSession } from '../utils/storage';
import type { AttendanceRecord, CashDrawerSession } from '../api/types';

const CASH_DRAWER_ROLES = new Set(['cashier', 'manager', 'admin', 'owner']);

function elapsed(since: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(since).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function AttendanceSection({ record, onChange }: { record: AttendanceRecord | null; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (fn: () => Promise<AttendanceRecord>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-3 font-heading text-lg font-semibold">Attendance</h2>
      {record ? (
        <div className="flex flex-col gap-3">
          <p className="text-muted">
            Clocked in at {new Date(record.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
            {elapsed(record.clockInAt)} so far
          </p>
          {error && <p className="text-error">{error}</p>}
          <PrimaryButton onClick={() => act(clockOut)} disabled={busy}>
            {busy ? 'Clocking out…' : 'Clock out'}
          </PrimaryButton>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-muted">You're not clocked in.</p>
          {error && <p className="text-error">{error}</p>}
          <PrimaryButton onClick={() => act(clockIn)} disabled={busy}>
            {busy ? 'Clocking in…' : 'Clock in'}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

function CashDrawerSectionView({ session, branchId, onChange }: { session: CashDrawerSession | null; branchId: string; onChange: () => void }) {
  const [openingFloat, setOpeningFloat] = useState('');
  const [countedClosingCash, setCountedClosingCash] = useState('');
  const [varianceNote, setVarianceNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justClosed, setJustClosed] = useState<CashDrawerSession | null>(null);

  const open = async () => {
    setBusy(true);
    setError(null);
    try {
      await openCashDrawer(branchId, openingFloat);
      setOpeningFloat('');
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t open the drawer.');
    } finally {
      setBusy(false);
    }
  };

  const close = async () => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const closed = await closeCashDrawer(session.id, countedClosingCash, varianceNote || undefined);
      setJustClosed(closed);
      setCountedClosingCash('');
      setVarianceNote('');
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t close the drawer.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-3 font-heading text-lg font-semibold">Cash drawer</h2>
      {session ? (
        <div className="flex flex-col gap-3">
          <p className="text-muted">
            Opened at {new Date(session.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} with{' '}
            {formatMoney(session.openingFloat)} float
          </p>
          <label className="text-sm font-medium">
            Counted cash now
            <input
              value={countedClosingCash}
              onChange={(e) => setCountedClosingCash(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-border p-3 text-lg"
            />
          </label>
          <label className="text-sm font-medium">
            Note (if there's a variance)
            <input
              value={varianceNote}
              onChange={(e) => setVarianceNote(e.target.value)}
              placeholder="optional"
              className="mt-1 w-full rounded-lg border border-border p-3"
            />
          </label>
          {error && <p className="text-error">{error}</p>}
          <PrimaryButton onClick={close} disabled={busy || !countedClosingCash}>
            {busy ? 'Closing…' : 'Close drawer'}
          </PrimaryButton>
        </div>
      ) : justClosed ? (
        <div className="flex flex-col gap-2">
          <p>
            Expected {formatMoney(justClosed.expectedClosingCash ?? '0')}, counted {formatMoney(justClosed.countedClosingCash ?? '0')}
          </p>
          <p className={Number(justClosed.variance) === 0 ? 'text-muted' : Number(justClosed.variance) > 0 ? 'text-success' : 'text-error'}>
            Variance: {formatMoney(justClosed.variance ?? '0')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-muted">Drawer is closed. Count your starting float to open it.</p>
          <label className="text-sm font-medium">
            Opening float
            <input
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-border p-3 text-lg"
            />
          </label>
          {error && <p className="text-error">{error}</p>}
          <PrimaryButton onClick={open} disabled={busy || !openingFloat}>
            {busy ? 'Opening…' : 'Open drawer'}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

export function MyShiftPage({ device, session, onBack }: { device: Device; session: StaffSession; onBack: () => void }) {
  const [attendance, setAttendance] = useState<AttendanceRecord | null | undefined>(undefined);
  const [drawer, setDrawer] = useState<CashDrawerSession | null | undefined>(undefined);
  const showCashDrawer = CASH_DRAWER_ROLES.has(session.staff.role);

  const load = () => {
    fetchMyOpenAttendance().then(setAttendance);
    if (showCashDrawer) fetchMyOpenCashDrawer().then(setDrawer);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (attendance === undefined || (showCashDrawer && drawer === undefined)) return <LoadingScreen label="Loading your shift…" />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header branchName={device.branchName} session={session} onBack={onBack} />
      <main className="flex-1 space-y-5 p-5">
        <AttendanceSection record={attendance} onChange={load} />
        {showCashDrawer && <CashDrawerSectionView session={drawer ?? null} branchId={device.branchId} onChange={load} />}
      </main>
    </div>
  );
}
