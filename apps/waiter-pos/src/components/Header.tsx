import { Clock } from './Clock';
import { setStaffSession } from '../state/store';
import type { StaffSession } from '../utils/storage';

export function Header({
  branchName,
  session,
  connected,
  onBack,
}: {
  branchName: string;
  session: StaffSession;
  connected?: boolean;
  onBack?: () => void;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-lg text-muted">
            ← Floor
          </button>
        )}
        <div>
          <h1 className="font-heading text-lg font-bold leading-tight">{branchName}</h1>
          <p className="text-sm text-muted">{session.staff.fullName}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {connected !== undefined && (
          <span className={`h-2.5 w-2.5 rounded-pill ${connected ? 'bg-success' : 'bg-error'}`} />
        )}
        <Clock />
        <button
          onClick={() => setStaffSession(null)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted active:bg-primary-light/40"
        >
          End shift
        </button>
      </div>
    </header>
  );
}
