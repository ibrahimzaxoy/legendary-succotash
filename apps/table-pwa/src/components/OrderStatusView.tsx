import { useState } from 'react';
import type { Order, OrderItemStatus } from '../api/types';
import { StatusBadge } from './StatusBadge';
import { formatMoney } from '../utils/money';
import { requestBill } from '../api/endpoints';

const DONE_STATUSES: OrderItemStatus[] = ['ready', 'served', 'cancelled'];

export function OrderStatusView({
  order,
  liveStatuses,
  onAddMore,
}: {
  order: Order;
  liveStatuses: Record<string, OrderItemStatus>;
  onAddMore: () => void;
}) {
  // Derived from the current item statuses rather than trusting a one-time
  // "order-ready" socket event on its own - a stale flag would otherwise
  // keep showing "ready" after a guest appends a fresh, still-queued item
  // to an order that was already ready.
  const allItemsDone = order.items.every((item) => DONE_STATUSES.includes(liveStatuses[item.id] ?? item.status));
  const [billState, setBillState] = useState<'idle' | 'requesting' | 'requested'>('idle');

  const handleRequestBill = async () => {
    setBillState('requesting');
    try {
      await requestBill(order.id);
      setBillState('requested');
    } catch {
      setBillState('idle');
    }
  };

  return (
    <div className="p-4 pb-28">
      {allItemsDone && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-center font-medium text-success">
          Your order is ready! 🎉
        </div>
      )}

      <h2 className="mb-3 font-heading text-lg font-semibold">Your order</h2>
      <div className="flex flex-col gap-2">
        {order.items.map((item) => {
          const status = liveStatuses[item.id] ?? item.status;
          return (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {item.quantity}× {item.nameSnapshot}
                </p>
                {item.modifiers.length > 0 && (
                  <p className="text-sm text-muted">{item.modifiers.map((m) => m.nameSnapshot).join(', ')}</p>
                )}
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

      <div className="mt-6 text-center text-sm text-muted">
        {billState === 'requested' ? (
          <p>Bill requested - a server will bring it to the table shortly.</p>
        ) : (
          <>
            <p className="mb-2">Ready to pay?</p>
            <button
              onClick={handleRequestBill}
              disabled={billState === 'requesting'}
              className="rounded-pill border border-border px-4 py-2 font-medium text-ink disabled:opacity-50"
            >
              {billState === 'requesting' ? 'Requesting…' : 'Request the bill'}
            </button>
          </>
        )}
      </div>

      <button
        onClick={onAddMore}
        className="fixed bottom-4 left-1/2 w-[calc(100%-2rem)] max-w-[calc(theme(maxWidth.app)-2rem)] -translate-x-1/2 rounded-pill bg-primary py-3.5 font-semibold text-white shadow-lg"
      >
        Order more
      </button>
    </div>
  );
}
