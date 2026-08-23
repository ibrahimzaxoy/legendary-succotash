import { useEffect, useState } from 'react';
import { assignDriver, createDelivery, fetchActiveOrders, fetchDeliveriesForBranch, fetchOrders, fetchStaff } from '../api/endpoints';
import { ApiError } from '../api/client';
import { LoadingScreen } from '../components/LoadingScreen';
import { RefundModal } from '../components/RefundModal';
import type { Delivery, Order, Staff } from '../api/types';

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-stone-100 text-muted',
  in_kitchen: 'bg-cooking/10 text-cooking',
  ready: 'bg-success/10 text-success',
  served: 'bg-primary/10 text-primary',
};

function channelLabel(order: Order): string {
  if (order.table) return `Table ${order.table.number}`;
  if (order.channel === 'mobile_delivery') return 'Delivery';
  if (order.channel === 'mobile_pickup') return 'Pickup';
  return 'Order';
}

export function OrdersPage({ branchId }: { branchId: string }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
  const [riders, setRiders] = useState<Staff[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null); // orderId currently showing the rider picker
  const [closedOrders, setClosedOrders] = useState<Order[] | null>(null);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null); // order currently showing the refund modal

  const load = () => {
    fetchActiveOrders(branchId).then(setOrders);
    fetchDeliveriesForBranch(branchId).then(setDeliveries);
    fetchStaff(branchId).then((all) => setRiders(all.filter((s) => s.role === 'rider' && s.active && s.onShift)));
  };

  // Closed orders load once (not on the 15s live-orders poll) - a cashier
  // looking to issue a refund is checking a specific recent order, not
  // watching this list update in real time.
  const loadClosed = () => fetchOrders(branchId, 'closed').then((all) => setClosedOrders(all.slice(0, 20)));

  useEffect(() => {
    setOrders(null);
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  useEffect(() => {
    setClosedOrders(null);
    loadClosed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const handleAssign = async (order: Order, driverStaffId: string) => {
    setError(null);
    try {
      const existing = deliveries?.find((d) => d.orderId === order.id);
      const delivery = existing ?? (await createDelivery({ orderId: order.id, branchId, address: order.deliveryAddress ?? '' }));
      await assignDriver(delivery.id, driverStaffId);
      setAssigning(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t assign a driver.');
    }
  };

  if (!orders || !deliveries || !riders) return <LoadingScreen label="Loading live orders…" />;

  return (
    <div className="p-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">Live Orders</h1>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded bg-error/10 px-4 py-2 text-sm text-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-semibold">
            Dismiss
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Dispatch</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
              const delivery = deliveries.find((d) => d.orderId === order.id);
              const needsDispatch = order.channel === 'mobile_delivery' && order.status === 'ready' && !delivery?.driverStaffId;

              return (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">
                    {channelLabel(order)}
                    {order.customerName && <span className="ml-1 text-muted">· {order.customerName}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{itemCount} item{itemCount === 1 ? '' : 's'}</td>
                  <td className="px-4 py-3">${Number(order.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[order.status] ?? 'bg-stone-100 text-muted'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {order.channel !== 'mobile_delivery' ? (
                      <span className="text-muted">—</span>
                    ) : delivery?.driverStaffId ? (
                      <span className="text-success">Driver assigned</span>
                    ) : needsDispatch ? (
                      assigning === order.id ? (
                        <select
                          autoFocus
                          onChange={(e) => e.target.value && handleAssign(order, e.target.value)}
                          onBlur={() => setAssigning(null)}
                          className="rounded border border-border p-1.5 text-sm"
                        >
                          <option value="">Pick a driver…</option>
                          {riders.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.fullName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button onClick={() => setAssigning(order.id)} className="font-medium text-primary" disabled={riders.length === 0}>
                          {riders.length === 0 ? 'No drivers on shift' : 'Assign driver'}
                        </button>
                      )
                    ) : (
                      <span className="text-muted">Not ready yet</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No orders in progress right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 mt-8 font-heading text-lg font-semibold">Recently closed</h2>
      {!closedOrders ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Closed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {closedOrders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">
                    {channelLabel(order)}
                    {order.customerName && <span className="ml-1 text-muted">· {order.customerName}</span>}
                  </td>
                  <td className="px-4 py-3">${Number(order.total).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setRefundOrder(order)} className="text-sm font-medium text-primary">
                      Payments &amp; refunds
                    </button>
                  </td>
                </tr>
              ))}
              {closedOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    No closed orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {refundOrder && (
        <RefundModal
          order={refundOrder}
          onClose={() => {
            setRefundOrder(null);
            loadClosed();
          }}
        />
      )}
    </div>
  );
}
