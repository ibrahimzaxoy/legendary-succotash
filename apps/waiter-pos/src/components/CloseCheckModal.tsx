import { useState } from 'react';
import { capturePayment, captureSplitByGuest, captureSplitEven } from '../api/endpoints';
import { ApiError } from '../api/client';
import { formatMoney } from '../utils/money';
import type { OrderDto, PaymentMethod } from '../api/types';

type Mode = 'single' | 'split-even' | 'split-guest';

// Groups items by orderedByGuestId (set when the order came from a shared
// table-session cart - see TableSessionsService.submit on the backend).
// Items without a guest tag (waiter-entered, or single-cart orders) fall
// into one "Whole table" bucket.
function guestGroups(order: OrderDto) {
  const byGuest = new Map<string, { label: string; total: number }>();
  for (const item of order.items) {
    const key = item.orderedByGuestId ?? 'ungrouped';
    const label = item.orderedByGuestLabel ?? 'Whole table';
    const modifiersTotal = item.modifiers.reduce((sum, m) => sum + Number(m.priceSnapshot), 0);
    const itemTotal = (Number(item.priceSnapshot) + modifiersTotal) * item.quantity;
    const existing = byGuest.get(key);
    byGuest.set(key, { label, total: (existing?.total ?? 0) + itemTotal });
  }
  return [...byGuest.values()];
}

export function CloseCheckModal({ order, onClose, onClosed }: { order: OrderDto; onClose: () => void; onClosed: () => void }) {
  const [mode, setMode] = useState<Mode>('single');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amount, setAmount] = useState(order.total);
  const [tipAmount, setTipAmount] = useState('0.00');
  const [parts, setParts] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const groups = guestGroups(order);
  const canSplitByGuest = groups.length >= 2;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'single') {
        await capturePayment({ orderId: order.id, method, amount, tipAmount });
      } else if (mode === 'split-even') {
        await captureSplitEven({ orderId: order.id, parts, method });
      } else {
        await captureSplitByGuest({ orderId: order.id, method });
      }
      onClosed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t close the check.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-6" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-1 text-center font-heading text-xl font-semibold">Close check</h2>
        <p className="mb-4 text-center text-sm text-muted">Total {formatMoney(order.total)}</p>

        <div className="mb-4 flex rounded-lg border border-border p-1 text-sm">
          <button
            onClick={() => setMode('single')}
            className={`flex-1 rounded py-2 font-medium ${mode === 'single' ? 'bg-primary text-white' : 'text-ink'}`}
          >
            One payment
          </button>
          <button
            onClick={() => setMode('split-even')}
            className={`flex-1 rounded py-2 font-medium ${mode === 'split-even' ? 'bg-primary text-white' : 'text-ink'}`}
          >
            Split evenly
          </button>
          {canSplitByGuest && (
            <button
              onClick={() => setMode('split-guest')}
              className={`flex-1 rounded py-2 font-medium ${mode === 'split-guest' ? 'bg-primary text-white' : 'text-ink'}`}
            >
              By guest
            </button>
          )}
        </div>

        <label className="mb-3 block text-sm font-medium">
          Payment method
          <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="mt-1 w-full rounded border border-border p-2">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
        </label>

        {mode === 'single' && (
          <>
            <label className="mb-3 block text-sm font-medium">
              Amount
              <input value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
            </label>
            <label className="mb-4 block text-sm font-medium">
              Tip
              <input value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
            </label>
          </>
        )}

        {mode === 'split-even' && (
          <label className="mb-4 block text-sm font-medium">
            Number of ways to split
            <div className="mt-1 flex items-center gap-3">
              <button onClick={() => setParts((p) => Math.max(2, p - 1))} className="rounded border border-border px-3 py-1.5 text-lg">
                −
              </button>
              <span className="min-w-8 text-center font-semibold">{parts}</span>
              <button onClick={() => setParts((p) => p + 1)} className="rounded border border-border px-3 py-1.5 text-lg">
                +
              </button>
              <span className="ml-auto text-sm text-muted">{formatMoney(Number(order.total) / parts)} each</span>
            </div>
          </label>
        )}

        {mode === 'split-guest' && (
          <div className="mb-4 flex flex-col gap-1.5">
            {groups.map((g) => (
              <div key={g.label} className="flex justify-between rounded border border-border px-3 py-2 text-sm">
                <span>{g.label}</span>
                <span className="font-medium">{formatMoney(g.total)}</span>
              </div>
            ))}
          </div>
        )}

        {error && <p className="mb-3 text-sm text-error">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-3.5 font-semibold text-white disabled:opacity-40"
        >
          {submitting ? 'Closing…' : 'Confirm & close check'}
        </button>
        <button onClick={onClose} className="mt-2 w-full py-2 text-sm text-muted">
          Cancel
        </button>
      </div>
    </div>
  );
}
