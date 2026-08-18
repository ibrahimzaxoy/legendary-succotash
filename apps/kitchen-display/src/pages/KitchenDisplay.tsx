import { useStationTickets } from '../hooks/useStationTickets';
import { useNowTick } from '../hooks/useNowTick';
import { Header } from '../components/Header';
import { TicketCard } from '../components/TicketCard';
import { LoadingScreen } from '../components/LoadingScreen';
import type { KdsSession } from '../utils/storage';

export function KitchenDisplay({ session }: { session: KdsSession & { stationId: string; stationName: string } }) {
  const { tickets, loading, connected, error, bump, dismissError } = useStationTickets(session.branchId, session.stationId);
  const now = useNowTick();

  const sorted = [...tickets].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="flex min-h-screen flex-col">
      <Header session={session} connected={connected} ticketCount={tickets.length} />

      {error && (
        <div className="flex items-center justify-between bg-error/15 px-6 py-2 text-error">
          <span>{error}</span>
          <button onClick={dismissError} className="font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <LoadingScreen label="Loading tickets…" />
      ) : sorted.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted">
          <div className="text-5xl">✅</div>
          <p className="text-xl">All caught up</p>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(320px,1fr))] content-start gap-4 p-4">
          {sorted.map((ticket) => (
            <TicketCard key={ticket.orderItemId} ticket={ticket} now={now} onBump={(status) => bump(ticket.orderItemId, status)} />
          ))}
        </div>
      )}
    </div>
  );
}
