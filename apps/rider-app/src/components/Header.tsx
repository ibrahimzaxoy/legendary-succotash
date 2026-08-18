import { setStaffSession } from '../state/store';
import type { StaffSession } from '../utils/storage';

export function Header({
  branchName,
  session,
  connected,
  onShift,
  onToggleShift,
  onBack,
}: {
  branchName: string;
  session: StaffSession;
  connected: boolean;
  onShift: boolean;
  onToggleShift: () => void;
  onBack?: () => void;
}) {
  return (
    <header className="border-b border-border bg-surface px-5 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="text-lg text-muted">
              ← Deliveries
            </button>
          )}
          {!onBack && (
            <div>
              <h1 className="font-heading text-lg font-bold leading-tight">{branchName}</h1>
              <p className="text-sm text-muted">{session.staff.fullName}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-pill ${connected ? 'bg-success' : 'bg-error'}`} title={connected ? 'Live' : 'Reconnecting…'} />
          <button
            onClick={() => setStaffSession(null)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted active:bg-primary-light/40"
          >
            Log out
          </button>
        </div>
      </div>
      {!onBack && (
        <button
          onClick={onToggleShift}
          className={`mt-3 flex w-full items-center justify-between rounded-lg px-4 py-3 text-left ${
            onShift ? 'bg-success/10 text-success' : 'bg-stone-100 text-muted'
          }`}
        >
          <span className="font-semibold">{onShift ? 'On shift — receiving dispatches' : 'Off shift'}</span>
          <span
            className={`relative h-6 w-11 shrink-0 rounded-pill transition-colors ${onShift ? 'bg-success' : 'bg-border'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-pill bg-white transition-transform ${onShift ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </span>
        </button>
      )}
    </header>
  );
}
