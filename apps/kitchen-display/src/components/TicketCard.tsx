import { ticketSourceLabel } from '../api/ticket';
import type { Ticket } from '../api/types';
import { elapsedMinutes, formatElapsed, urgencyTier } from '../utils/time';

const TIER_STYLES = {
  fresh: { border: 'border-border', chip: 'bg-white/5 text-muted', pulse: '' },
  warning: { border: 'border-cooking', chip: 'bg-cooking/15 text-cooking', pulse: '' },
  late: { border: 'border-error', chip: 'bg-error/15 text-error', pulse: 'pulse-late' },
};

const ACTION_BY_STATUS = {
  queued: { label: 'Start Cooking', next: 'cooking' as const, className: 'bg-cooking text-black active:bg-amber-600' },
  cooking: { label: 'Mark Ready', next: 'ready' as const, className: 'bg-success text-white active:bg-green-700' },
};

export function TicketCard({ ticket, now, onBump }: { ticket: Ticket; now: number; onBump: (status: 'cooking' | 'ready') => void }) {
  const minutes = elapsedMinutes(ticket.createdAt, now);
  const tier = urgencyTier(minutes);
  const styles = TIER_STYLES[tier];
  const action = ticket.status === 'queued' || ticket.status === 'cooking' ? ACTION_BY_STATUS[ticket.status] : null;

  return (
    <div className={`flex flex-col gap-3 rounded-lg border-2 bg-card p-4 ${styles.border} ${styles.pulse}`}>
      <div className="flex items-center justify-between">
        <span className="font-heading text-lg font-semibold">{ticketSourceLabel(ticket)}</span>
        <span className={`rounded-pill px-2.5 py-1 text-sm font-semibold ${styles.chip}`}>{formatElapsed(minutes)}</span>
      </div>

      <div>
        <p className="text-xl font-semibold leading-tight">
          {ticket.quantity}× {ticket.name}
        </p>
        {ticket.modifiers.length > 0 && <p className="mt-1 text-base text-muted">{ticket.modifiers.join(', ')}</p>}
        {ticket.notes && <p className="mt-1 text-base italic text-primary">“{ticket.notes}”</p>}
      </div>

      {action ? (
        <button onClick={() => onBump(action.next)} className={`mt-1 rounded-lg py-4 text-lg font-bold ${action.className}`}>
          {action.label}
        </button>
      ) : (
        <div className="mt-1 rounded-lg bg-success/15 py-4 text-center text-lg font-bold text-success">Ready ✓</div>
      )}
    </div>
  );
}
