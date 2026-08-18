import type { CartLine } from '../utils/cart';
import { formatMoney } from '../utils/money';

export function CartDrawer({
  lines,
  updateQuantity,
  removeLine,
  onClose,
  onCheckout,
}: {
  lines: CartLine[];
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full flex-col rounded-t-lg bg-card pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-4 h-1 w-10 rounded-pill bg-border" />
        <h2 className="px-5 pt-3 font-heading text-xl font-semibold">Your order</h2>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {lines.length === 0 && <p className="py-8 text-center text-muted">Your cart is empty.</p>}
          {lines.map((line) => (
            <div key={line.lineId} className="flex items-start justify-between gap-3 border-b border-border py-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {line.menuItem.name}
                  {line.variant && <span className="text-muted"> ({line.variant.name})</span>}
                </p>
                {line.modifiers.length > 0 && (
                  <p className="text-sm text-muted">{line.modifiers.map((m) => m.name).join(', ')}</p>
                )}
                {line.notes && <p className="text-sm italic text-muted">“{line.notes}”</p>}
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex items-center rounded-pill border border-border">
                    <button onClick={() => updateQuantity(line.lineId, line.quantity - 1)} className="px-2.5 py-1 text-base">
                      −
                    </button>
                    <span className="min-w-5 text-center text-sm font-medium">{line.quantity}</span>
                    <button onClick={() => updateQuantity(line.lineId, line.quantity + 1)} className="px-2.5 py-1 text-base">
                      +
                    </button>
                  </div>
                  <button onClick={() => removeLine(line.lineId)} className="text-sm text-error">
                    Remove
                  </button>
                </div>
              </div>
              <p className="shrink-0 font-medium">{formatMoney(line.unitPrice * line.quantity)}</p>
            </div>
          ))}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-border p-5">
            <div className="mb-3 flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <button onClick={onCheckout} className="w-full rounded-pill bg-primary py-3.5 font-semibold text-white">
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
