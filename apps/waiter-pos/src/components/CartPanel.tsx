import type { CartLine } from '../utils/cart';
import { formatMoney } from '../utils/money';

export function CartPanel({
  lines,
  updateQuantity,
  removeLine,
  onSubmit,
  submitLabel,
  submitting,
  error,
}: {
  lines: CartLine[];
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
}) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-heading text-lg font-semibold">This order</h2>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {lines.length === 0 && <p className="py-8 text-center text-muted">No items added yet.</p>}
        {lines.map((line) => (
          <div key={line.lineId} className="border-b border-border py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">
                  {line.menuItem.name}
                  {line.variant && <span className="text-muted"> ({line.variant.name})</span>}
                </p>
                {line.modifiers.length > 0 && (
                  <p className="text-sm text-muted">{line.modifiers.map((m) => m.name).join(', ')}</p>
                )}
                {line.notes && <p className="text-sm italic text-muted">“{line.notes}”</p>}
              </div>
              <p className="shrink-0 text-sm font-medium">{formatMoney(line.unitPrice * line.quantity)}</p>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex items-center rounded-pill border border-border">
                <button onClick={() => updateQuantity(line.lineId, line.quantity - 1)} className="px-2.5 py-1">
                  −
                </button>
                <span className="min-w-5 text-center text-sm font-medium">{line.quantity}</span>
                <button onClick={() => updateQuantity(line.lineId, line.quantity + 1)} className="px-2.5 py-1">
                  +
                </button>
              </div>
              <button onClick={() => removeLine(line.lineId)} className="text-sm text-error">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border p-4">
        <div className="mb-3 flex justify-between text-sm text-muted">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        {error && <p className="mb-2 text-sm text-error">{error}</p>}
        <button
          onClick={onSubmit}
          disabled={lines.length === 0 || submitting}
          className="w-full rounded-pill bg-primary py-3.5 font-semibold text-white disabled:opacity-40"
        >
          {submitting ? 'Sending…' : submitLabel}
        </button>
      </div>
    </div>
  );
}
