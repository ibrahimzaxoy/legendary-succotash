import { useEffect, useState } from 'react';
import { fetchMyDeliveries, fetchStaffSelf, setMyShift } from '../api/endpoints';
import { useDeliverySocket } from '../hooks/useDeliverySocket';
import { useNowTick } from '../hooks/useNowTick';
import { Header } from '../components/Header';
import { LoadingScreen } from '../components/LoadingScreen';
import { StatusBadge } from '../components/StatusBadge';
import { formatMoney } from '../utils/money';
import type { Device, StaffSession } from '../utils/storage';
import type { Delivery } from '../api/types';

const ACTIVE_STATUSES = new Set(['assigned', 'picked_up', 'en_route']);

function minutesAgo(iso: string, now: number): string {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} min ago`;
}

function DeliveryCard({ delivery, now, onOpen }: { delivery: Delivery; now: number; onOpen: () => void }) {
  const order = delivery.order;
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  return (
    <button
      onClick={onOpen}
      className={`flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left active:bg-primary-light/20 ${
        delivery.status === 'assigned' ? 'pulse-new' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-base font-bold leading-tight">{order.customerName ?? 'Guest'}</p>
          <p className="text-sm text-muted">{delivery.address}</p>
        </div>
        <StatusBadge status={delivery.status} />
      </div>
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {itemCount} item{itemCount === 1 ? '' : 's'} · {formatMoney(order.total)}
        </span>
        <span>{minutesAgo(delivery.assignedAt, now)}</span>
      </div>
    </button>
  );
}

export function DeliveryList({
  device,
  session,
  onOpenDelivery,
}: {
  device: Device;
  session: StaffSession;
  onOpenDelivery: (deliveryId: string) => void;
}) {
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
  const [onShift, setOnShift] = useState(false);
  const [shiftBusy, setShiftBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useNowTick();
  const { connected, refreshPulse } = useDeliverySocket(session.staff.id);

  const load = () => {
    fetchMyDeliveries()
      .then(setDeliveries)
      .catch(() => setError('Couldn’t load your deliveries.'));
  };

  useEffect(() => {
    fetchStaffSelf(session.staff.id)
      .then((self) => setOnShift(self.onShift))
      .catch(() => {});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.staff.id]);

  useEffect(() => {
    if (refreshPulse > 0) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshPulse]);

  const toggleShift = async () => {
    setShiftBusy(true);
    try {
      const next = !onShift;
      await setMyShift(next);
      setOnShift(next);
    } catch {
      setError('Couldn’t update your shift status.');
    } finally {
      setShiftBusy(false);
    }
  };

  if (!deliveries) return <LoadingScreen label="Loading your deliveries…" />;

  const active = deliveries
    .filter((d) => ACTIVE_STATUSES.has(d.status))
    .sort((a, b) => new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime());
  const completed = deliveries
    .filter((d) => !ACTIVE_STATUSES.has(d.status))
    .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
    .slice(0, 20);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        branchName={device.branchName}
        session={session}
        connected={connected}
        onShift={onShift}
        onToggleShift={shiftBusy ? () => {} : toggleShift}
      />
      <main className="flex-1 space-y-6 px-4 py-5">
        {error && <p className="text-center text-sm text-error">{error}</p>}

        <section>
          <h2 className="mb-2 font-heading text-sm font-bold uppercase tracking-wide text-muted">
            Active ({active.length})
          </h2>
          {active.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">
              {onShift ? 'No deliveries assigned yet. New dispatches show up here automatically.' : 'Go on shift to start receiving dispatches.'}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {active.map((d) => (
                <DeliveryCard key={d.id} delivery={d} now={now} onOpen={() => onOpenDelivery(d.id)} />
              ))}
            </div>
          )}
        </section>

        {completed.length > 0 && (
          <section>
            <h2 className="mb-2 font-heading text-sm font-bold uppercase tracking-wide text-muted">Completed</h2>
            <div className="flex flex-col gap-3">
              {completed.map((d) => (
                <DeliveryCard key={d.id} delivery={d} now={now} onOpen={() => onOpenDelivery(d.id)} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
