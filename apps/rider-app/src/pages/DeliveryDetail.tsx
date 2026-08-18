import { useEffect, useState } from 'react';
import { fetchMyDeliveries, updateDeliveryStatus } from '../api/endpoints';
import { ApiError } from '../api/client';
import { Header } from '../components/Header';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { StatusBadge } from '../components/StatusBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { formatMoney } from '../utils/money';
import type { Device, StaffSession } from '../utils/storage';
import type { Delivery, DeliveryStatus } from '../api/types';

const NEXT_STATUS: Partial<Record<DeliveryStatus, { status: DeliveryStatus; label: string }>> = {
  assigned: { status: 'picked_up', label: 'Picked up from restaurant' },
  picked_up: { status: 'en_route', label: "I'm on my way" },
};

function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function DeliveryDetail({
  device,
  session,
  deliveryId,
  onBack,
}: {
  device: Device;
  session: StaffSession;
  deliveryId: string;
  onBack: () => void;
}) {
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<DeliveryStatus | null>(null);

  const load = () => {
    fetchMyDeliveries()
      .then((all) => {
        const found = all.find((d) => d.id === deliveryId);
        if (!found) {
          setError('This delivery is no longer assigned to you.');
          return;
        }
        setDelivery(found);
      })
      .catch(() => setError('Couldn’t load this delivery.'));
  };

  useEffect(load, [deliveryId]);

  const advance = async (status: DeliveryStatus) => {
    setSubmitting(status);
    setError(null);
    try {
      await updateDeliveryStatus(deliveryId, status);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t update the delivery.');
    } finally {
      setSubmitting(null);
    }
  };

  if (error && !delivery) return <ErrorScreen message={error} />;
  if (!delivery) return <LoadingScreen label="Loading delivery…" />;

  const order = delivery.order;
  const next = NEXT_STATUS[delivery.status];
  const canResolve = delivery.status === 'en_route' || delivery.status === 'picked_up';

  return (
    <div className="flex min-h-screen flex-col">
      <Header branchName={device.branchName} session={session} connected onShift onToggleShift={() => {}} onBack={onBack} />
      <main className="flex-1 space-y-5 px-4 py-5">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold">{order.customerName ?? 'Guest'}</h1>
          <StatusBadge status={delivery.status} />
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Deliver to</p>
          <p className="text-base">{delivery.address}</p>
          <a
            href={mapsUrl(delivery.address)}
            target="_blank"
            rel="noreferrer"
            className="mt-1 rounded-lg border border-primary px-4 py-2.5 text-center font-semibold text-primary active:bg-primary-light/40"
          >
            Open in Maps
          </a>
          {order.customerPhone && (
            <a
              href={telUrl(order.customerPhone)}
              className="rounded-lg border border-border px-4 py-2.5 text-center font-semibold text-ink active:bg-primary-light/40"
            >
              Call {order.customerPhone}
            </a>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Order</p>
          <ul className="flex flex-col gap-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.quantity}× {item.nameSnapshot}
                  {item.modifiers.length > 0 && (
                    <span className="block text-muted">{item.modifiers.map((m) => m.nameSnapshot).join(', ')}</span>
                  )}
                  {item.notes && <span className="block italic text-muted">“{item.notes}”</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.total)}</span>
          </div>
        </div>

        {error && <p className="text-center text-error">{error}</p>}

        <div className="flex flex-col gap-3 pb-6">
          {next && (
            <PrimaryButton onClick={() => advance(next.status)} disabled={submitting !== null}>
              {submitting === next.status ? 'Updating…' : next.label}
            </PrimaryButton>
          )}
          {canResolve && (
            <>
              <PrimaryButton
                onClick={() => advance('delivered')}
                disabled={submitting !== null}
                className="bg-success active:bg-success"
              >
                {submitting === 'delivered' ? 'Updating…' : 'Mark delivered'}
              </PrimaryButton>
              <button
                onClick={() => advance('failed')}
                disabled={submitting !== null}
                className="rounded-lg border border-error py-3 font-semibold text-error disabled:opacity-40"
              >
                {submitting === 'failed' ? 'Updating…' : 'Report failed delivery'}
              </button>
            </>
          )}
          {delivery.status === 'delivered' && <p className="text-center text-success">Delivered ✓</p>}
          {delivery.status === 'failed' && <p className="text-center text-error">Marked as failed</p>}
        </div>
      </main>
    </div>
  );
}
