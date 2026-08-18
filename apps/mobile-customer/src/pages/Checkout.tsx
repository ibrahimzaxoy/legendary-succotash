import { useState } from 'react';
import { placeOrder } from '../api/endpoints';
import { ApiError } from '../api/client';
import { cartLinesToOrderItemInputs, type CartLine } from '../utils/cart';
import { addToHistory, loadGuestProfile, saveGuestProfile } from '../utils/storage';
import { Header } from '../components/Header';
import { formatMoney } from '../utils/money';
import type { Branch, OrderChannel } from '../api/types';

export function Checkout({
  branch,
  channel,
  deliveryAddress,
  lines,
  onBack,
  onPlaced,
}: {
  branch: Branch;
  channel: OrderChannel;
  deliveryAddress?: string;
  lines: CartLine[];
  onBack: () => void;
  onPlaced: (orderId: string) => void;
}) {
  const profile = loadGuestProfile();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const canSubmit = name.trim().length > 0 && phone.trim().length > 0;

  const handlePlaceOrder = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await placeOrder({
        branchId: branch.id,
        channel,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        deliveryAddress,
        items: cartLinesToOrderItemInputs(lines),
      });
      saveGuestProfile({ name: name.trim(), phone: phone.trim(), address: deliveryAddress ?? profile.address });
      addToHistory({ orderId: order.id, branchName: branch.name, channel, placedAt: order.createdAt });
      onPlaced(order.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t place your order - check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-app bg-surface pb-8">
      <Header title="Checkout" subtitle={branch.name} onBack={onBack} />

      <div className="p-5">
        <fieldset className="flex flex-col gap-3">
          <label className="text-sm font-semibold">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="rounded-lg border border-border p-3 text-sm outline-primary"
          />
          <label className="text-sm font-semibold">Phone number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="For order updates"
            type="tel"
            className="rounded-lg border border-border p-3 text-sm outline-primary"
          />
        </fieldset>

        {channel === 'mobile_delivery' && deliveryAddress && (
          <div className="mt-5">
            <h2 className="text-sm font-semibold">Delivering to</h2>
            <p className="mt-1 text-sm text-muted">{deliveryAddress}</p>
          </div>
        )}

        <div className="mt-6">
          <h2 className="mb-2 font-heading text-lg font-semibold">Order summary</h2>
          {lines.map((line) => (
            <div key={line.lineId} className="flex justify-between py-1.5 text-sm">
              <span>
                {line.quantity}× {line.menuItem.name}
                {line.variant && ` (${line.variant.name})`}
              </span>
              <span>{formatMoney(line.unitPrice * line.quantity)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-card p-3.5 text-sm text-muted">
          Pay with <span className="font-medium text-ink">cash</span> when your order{' '}
          {channel === 'mobile_delivery' ? 'arrives' : 'is picked up'}. Card payment isn’t available yet.
        </div>

        {error && <p className="mt-4 text-center text-sm text-error">{error}</p>}

        <button
          onClick={handlePlaceOrder}
          disabled={!canSubmit || submitting}
          className="mt-6 w-full rounded-pill bg-primary py-3.5 font-semibold text-white disabled:opacity-40"
        >
          {submitting ? 'Placing order…' : `Place order · ${formatMoney(subtotal)}`}
        </button>
      </div>
    </div>
  );
}
