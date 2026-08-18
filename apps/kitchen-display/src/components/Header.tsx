import { useState } from 'react';
import { Clock } from './Clock';
import { setSession } from '../state/sessionStore';
import type { KdsSession } from '../utils/storage';

export function Header({
  session,
  connected,
  ticketCount,
}: {
  session: KdsSession;
  connected: boolean;
  ticketCount: number;
}) {
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-2xl font-bold">{session.stationName}</h1>
        <span className="rounded-pill bg-primary/15 px-2.5 py-1 text-sm font-semibold text-primary">
          {ticketCount} active
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-pill ${connected ? 'bg-success' : 'bg-error'}`} />
          <span className="text-sm text-muted">{connected ? 'Live' : 'Reconnecting…'}</span>
        </div>
        <Clock />
        {confirmingLogout ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSession({ ...session, stationId: null, stationName: null })}
              className="rounded-lg bg-error px-3 py-1.5 text-sm font-semibold text-white"
            >
              Change station
            </button>
            <button onClick={() => setConfirmingLogout(false)} className="rounded-lg border border-border px-3 py-1.5 text-sm">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingLogout(true)}
            aria-label="Settings"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted active:bg-cardhover"
          >
            ⚙
          </button>
        )}
      </div>
    </header>
  );
}
