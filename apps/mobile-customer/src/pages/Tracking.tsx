import { useEffect, useState } from 'react';
import { fetchOrder } from '../api/endpoints';
import { useOrderSocket } from '../hooks/useOrderSocket';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { formatMoney } from '../utils/money';
import type { OrderDto, OrderItemStatus } from '../api/types';

const DONE_STATUSES: OrderItemStatus[] = ['ready', 'served', 'cancelled'];

export function Tracking({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { itemStatusUpdates } = useOrderSocket(orderId);

  useEffect(() => {
    fetchOrder(orderId)
      .then(setOrder)
      .catch(() => setError('Couldn’t load this order.'));
  }, [orderId]);

  if (error) return <ErrorScreen message={error} />;
  if (!order) return <LoadingScreen label="Loading your order…" />;

  const allItemsDone = order.items.every((item) => DONE_STATUSES.includes(itemStatusUpdates[item.id] ?? item.status));
  const isDelivery = order.channel === 'mobile_delivery';

  return (
    <div className="mx-auto min-h-screen max-w-app bg-surface pb-8">
      <Header title="Order status" onBack={onDone} />

      <div className="p-5">
        {allItemsDone && (
          <div className="mb-4 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-center font-medium text-success">
            {isDelivery ? 'Your order is ready and heading out! 🎉' : 'Your order is ready for pickup! 🎉'}
          </div>
        )}

        <h2 className="mb-3 font-heading text-lg font-semibold">
          {isDelivery ? `Delivering to ${order.deliveryAddress}` : 'Ready when you are'}
        </h2>

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

        <p className="mt-6 text-center text-sm text-muted">
          Pay with cash when your order {isDelivery ? 'arrives' : 'is picked up'}.
        </p>

        <button onClick={onDone} className="mt-6 w-full rounded-pill border border-border bg-card py-3.5 font-semibold">
          Order again
        </button>
      </div>
    </div>
  );
}
