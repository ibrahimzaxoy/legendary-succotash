import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CartLine } from './cartTypes';
import type { OrderItemInput } from '../api/types';

interface CartContextValue {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, 'lineId'>) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
  subtotal: number;
  itemCount: number;
  toOrderItemInputs: () => OrderItemInput[];
}

const CartContext = createContext<CartContextValue | null>(null);

// Cart is local to this device only, cleared once its contents are
// submitted to the server. "Shared table ordering" happens after
// submission: the backend appends every guest's submitted items onto the
// same table order (see OrdersService.addItems), not by syncing carts
// pre-submit across devices.
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addLine = (line: Omit<CartLine, 'lineId'>) => {
    setLines((prev) => [...prev, { ...line, lineId: crypto.randomUUID() }]);
  };

  const updateQuantity = (lineId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.lineId !== lineId) : prev.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)),
    );
  };

  const removeLine = (lineId: string) => setLines((prev) => prev.filter((l) => l.lineId !== lineId));

  const clear = () => setLines([]);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0), [lines]);
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  const toOrderItemInputs = (): OrderItemInput[] =>
    lines.map((l) => ({
      menuItemId: l.menuItem.id,
      menuItemVariantId: l.variant?.id,
      modifierOptionIds: l.modifiers.map((m) => m.id),
      quantity: l.quantity,
      notes: l.notes || undefined,
    }));

  return (
    <CartContext.Provider value={{ lines, addLine, updateQuantity, removeLine, clear, subtotal, itemCount, toOrderItemInputs }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
