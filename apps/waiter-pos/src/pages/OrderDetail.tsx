import { useEffect, useState } from 'react';
import { fetchOrder, markServed } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useOrderSocket } from '../hooks/useOrderSocket';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { CloseCheckModal } from '../components/CloseCheckModal';
import { formatMoney } from '../utils/money';
import type { OrderDto, RestaurantTable } from '../api/types';
import type { StaffSession } from '../utils/storage';

const CASHIER_ROLES = new Set(['cashier', 'manager', 'admin', 'owner']);

export function OrderDetail({
  session,
  orderId,
  onBack,
  onAddItems,
}: {
  session: StaffSession;
  orderId: string;
  onBack: () => void;
  onAddItems: (table: RestaurantTable) => void;
}) {
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serving, setServing] = useState(false);
  const [showCloseCheck, setShowCloseCheck] = useState(false);
  const { itemStatusUpdates, readyPulse } = useOrderSocket(orderId);

  const load = () => {
    fetchOrder(orderId)
      .then(setOrder)
      .catch(() => setError('Couldn’t load this order.'));
  };

  useEffect(load, [orderId]);
  // The order-level status (which "Mark served" is gated on) only changes
  // server-side once every item is ready - refetch it when that happens
  // instead of waiting for the item badges to imply it.
  useEffect(() => {
    if (readyPulse > 0) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyPulse]);

  const handleServe = async () => {
    setServing(true);
    try {
      const updated = await markServed(orderId);
      setOrder(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t mark the order served.');
    } finally {
      setServing(false);
    }
  };

  if (error) return <ErrorScreen message={error} />;
  if (!order) return <LoadingScreen label="Loading order…" />;

  const tableLabel = order.table ? `Table ${order.table.number}` : 'Order';

  return (
    <div className="flex min-h-screen flex-col">
      <Header branchName={tableLabel} session={session} onBack={onBack} />

      <div className="mx-auto w-full max-w-2xl flex-1 p-5 pb-28">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Order status</h2>
          <span className="rounded-pill bg-primary/10 px-3 py-1 text-sm font-semibold capitalize text-primary">
            {order.status.replace('_', ' ')}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {order.items.map((item) => {
            const status = itemStatusUpdates[item.id] ?? item.status;
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {item.quantity}× {item.nameSnapshot}
                  </p>
                  {item.modifiers.length > 0 && (
                    <p className="text-sm text-muted">{item.modifiers.map((m) => m.nameSnapshot).join(', ')}</p>
                  )}
                  {item.notes && <p className="text-sm italic text-muted">“{item.notes}”</p>}
                </div>
                <StatusBadge status={status} />
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm text-muted">
          <span>Subtotal</span>
          <span>{formatMoney(order.subtotal)}</span>
        </div>

        {order.status === 'served' && !CASHIER_ROLES.has(session.staff.role) && (
          <p className="mt-6 text-center text-sm text-muted">Served - a cashier will close this check when the guest pays.</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex gap-3 border-t border-border bg-surface p-4">
        {order.table && order.status !== 'closed' && (
          <button
            onClick={() => onAddItems(order.table!)}
            className="flex-1 rounded-pill border border-border bg-card py-3.5 font-semibold"
          >
            Add items
          </button>
        )}
        {order.status === 'served' && CASHIER_ROLES.has(session.staff.role) ? (
          <button
            onClick={() => setShowCloseCheck(true)}
            className="flex-1 rounded-pill bg-primary py-3.5 font-semibold text-white"
          >
            Close check
          </button>
        ) : (
          <button
            onClick={handleServe}
            disabled={order.status !== 'ready' || serving}
            className="flex-1 rounded-pill bg-primary py-3.5 font-semibold text-white disabled:opacity-40"
          >
            {order.status === 'served' || order.status === 'closed' ? 'Served ✓' : serving ? 'Marking…' : 'Mark served'}
          </button>
        )}
      </div>

      {showCloseCheck && (
        <CloseCheckModal
          order={order}
          onClose={() => setShowCloseCheck(false)}
          onClosed={() => {
            setShowCloseCheck(false);
            load();
          }}
        />
      )}
    </div>
  );
}
