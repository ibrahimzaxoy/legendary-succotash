import { useEffect, useState } from 'react';
import { lookupLoyalty, placeOrder, validatePromoCode } from '../api/endpoints';
import { ApiError } from '../api/client';
import { cartLinesToOrderItemInputs, type CartLine } from '../utils/cart';
import { addToHistory, loadGuestProfile, saveGuestProfile } from '../utils/storage';
import { subscribeToOrderPush } from '../utils/push';
import { Header } from '../components/Header';
import { formatMoney } from '../utils/money';
import type { Branch, LoyaltyPreview, OrderChannel } from '../api/types';

// $0.05 per point, mirrors LoyaltyService.POINT_REDEMPTION_VALUE on the
// backend - used only to preview a discount amount here; the backend is
// the source of truth and re-derives (and clamps) it independently.
const POINT_REDEMPTION_VALUE = 0.05;

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

  const [loyalty, setLoyalty] = useState<LoyaltyPreview | null>(null);
  const [redeemPoints, setRedeemPoints] = useState('');

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: string } | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const canSubmit = name.trim().length > 0 && phone.trim().length > 0;

  // Look up the loyalty balance once the phone number looks real - a
  // returning guest sees their points before they've done anything else.
  useEffect(() => {
    const trimmed = phone.trim();
    if (trimmed.length < 7) {
      setLoyalty(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      lookupLoyalty(branch.id, trimmed)
        .then((result) => !cancelled && setLoyalty(result))
        .catch(() => !cancelled && setLoyalty(null));
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [branch.id, phone]);

  const redeemablePoints = loyalty ? Math.min(loyalty.pointsBalance, Math.floor(subtotal / POINT_REDEMPTION_VALUE)) : 0;
  const loyaltyDiscount = redeemPoints ? Math.min(Number(redeemPoints), redeemablePoints) * POINT_REDEMPTION_VALUE : 0;
  const promoDiscount = appliedPromo ? Number(appliedPromo.discountAmount) : 0;
  const total = Math.max(subtotal - loyaltyDiscount - promoDiscount, 0);

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setApplyingPromo(true);
    setPromoError(null);
    try {
      const preview = await validatePromoCode(branch.id, promoInput.trim(), subtotal.toFixed(2));
      setAppliedPromo({ code: promoInput.trim(), discountAmount: preview.discountAmount });
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err instanceof ApiError ? err.message : 'That promo code isn’t valid.');
    } finally {
      setApplyingPromo(false);
    }
  };

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
        promoCode: appliedPromo?.code,
        redeemLoyaltyPoints: redeemPoints ? Math.min(Number(redeemPoints), redeemablePoints) : undefined,
        items: cartLinesToOrderItemInputs(lines),
      });
      saveGuestProfile({ name: name.trim(), phone: phone.trim(), address: deliveryAddress ?? profile.address });
      addToHistory({ orderId: order.id, branchName: branch.name, channel, placedAt: order.createdAt });
      onPlaced(order.id);
      void subscribeToOrderPush(order.id);
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

        {loyalty && loyalty.pointsBalance > 0 && (
          <div className="mt-5 rounded-lg border border-border bg-card p-3.5">
            <p className="text-sm font-semibold">You have {loyalty.pointsBalance} points</p>
            <p className="mb-2 text-xs text-muted">Worth up to {formatMoney(redeemablePoints * POINT_REDEMPTION_VALUE)} off this order.</p>
            <div className="flex items-center gap-2">
              <input
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                inputMode="numeric"
                className="w-20 rounded border border-border p-2 text-sm"
              />
              <span className="text-sm text-muted">points</span>
              <button
                onClick={() => setRedeemPoints(String(redeemablePoints))}
                className="ml-auto text-sm font-medium text-primary"
              >
                Use max
              </button>
            </div>
          </div>
        )}

        <div className="mt-5">
          <label className="text-sm font-semibold">Promo code</label>
          <div className="mt-1.5 flex gap-2">
            <input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10"
              disabled={!!appliedPromo}
              className="flex-1 rounded-lg border border-border p-3 text-sm uppercase outline-primary disabled:bg-stone-50 disabled:text-muted"
            />
            {appliedPromo ? (
              <button
                onClick={() => {
                  setAppliedPromo(null);
                  setPromoInput('');
                }}
                className="rounded-lg border border-border px-4 text-sm font-semibold"
              >
                Remove
              </button>
            ) : (
              <button
                onClick={applyPromo}
                disabled={applyingPromo || !promoInput.trim()}
                className="rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                {applyingPromo ? '…' : 'Apply'}
              </button>
            )}
          </div>
          {promoError && <p className="mt-1.5 text-sm text-error">{promoError}</p>}
          {appliedPromo && <p className="mt-1.5 text-sm text-success">{appliedPromo.code} applied · −{formatMoney(promoDiscount)}</p>}
        </div>

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
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          {loyaltyDiscount > 0 && (
            <div className="flex justify-between text-sm text-success">
              <span>Loyalty points</span>
              <span>−{formatMoney(loyaltyDiscount)}</span>
            </div>
          )}
          {promoDiscount > 0 && (
            <div className="flex justify-between text-sm text-success">
              <span>Promo code</span>
              <span>−{formatMoney(promoDiscount)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
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
          {submitting ? 'Placing order…' : `Place order · ${formatMoney(total)}`}
        </button>
      </div>
    </div>
  );
}
