import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';
import { addSharedCartItem, removeSharedCartItem, submitTableSession } from '../api/endpoints';
import type { CartLine } from './cartTypes';
import type { Guest, MenuItem, MenuItemVariant, ModifierOption, SharedCartItem } from '../api/types';

export interface CartLineInput {
  menuItem: MenuItem;
  variant: MenuItemVariant | null;
  modifiers: ModifierOption[];
  quantity: number;
  notes: string;
}

interface CartContextValue {
  lines: CartLine[];
  guests: Guest[];
  addLine: (line: CartLineInput) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  subtotal: number;
  itemCount: number;
  submit: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function toCartLine(item: SharedCartItem, guests: Guest[], myGuestId: string): CartLine {
  return {
    lineId: item.id,
    guestId: item.guestId,
    guestLabel: guests.find((g) => g.id === item.guestId)?.guestLabel ?? 'Guest',
    isMine: item.guestId === myGuestId,
    nameSnapshot: item.nameSnapshot,
    unitPriceSnapshot: item.unitPriceSnapshot,
    modifierNamesSnapshot: item.modifierNamesSnapshot ?? [],
    quantity: item.quantity,
    notes: item.notes ?? '',
  };
}

// The cart is live-shared pre-submission (see IMPLEMENTATION_PLAN.md §18):
// every add/remove is persisted to the server immediately and broadcast to
// every phone at the table over the `table-session:{tableId}` room, this
// phone's own view included - so there's no local-only optimistic state to
// reconcile, just a mirror of the server's SharedCartItem rows.
export function CartProvider({
  tableId,
  sessionId,
  myGuestId,
  initialGuests,
  initialCartItems,
  onSubmitted,
  children,
}: {
  tableId: string;
  sessionId: string;
  myGuestId: string;
  initialGuests: Guest[];
  initialCartItems: SharedCartItem[];
  onSubmitted: (orderId: string) => void;
  children: ReactNode;
}) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [items, setItems] = useState<SharedCartItem[]>(initialCartItems);
  const socketRef = useRef<Socket | null>(null);
  const guestsRef = useRef(guests);
  guestsRef.current = guests;

  useEffect(() => {
    const socket = io(`${API_BASE_URL}/orders`, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('watch-table-session', { tableId }));

    socket.on('guest-joined', (evt: { tableId: string; guest: Guest }) => {
      if (evt.tableId !== tableId) return;
      setGuests((prev) => (prev.some((g) => g.id === evt.guest.id) ? prev : [...prev, evt.guest]));
    });

    socket.on('cart-item-added', (evt: { tableId: string; item: SharedCartItem }) => {
      if (evt.tableId !== tableId) return;
      setItems((prev) => (prev.some((i) => i.id === evt.item.id) ? prev : [...prev, evt.item]));
    });

    socket.on('cart-item-removed', (evt: { tableId: string; itemId: string }) => {
      if (evt.tableId !== tableId) return;
      setItems((prev) => prev.filter((i) => i.id !== evt.itemId));
    });

    socket.on('cart-submitted', (evt: { tableId: string; orderId: string }) => {
      if (evt.tableId !== tableId) return;
      setItems([]);
      onSubmitted(evt.orderId);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, sessionId]);

  const lines = useMemo(() => items.map((item) => toCartLine(item, guests, myGuestId)), [items, guests, myGuestId]);
  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + Number(l.unitPriceSnapshot) * l.quantity, 0), [lines]);
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  const addLine = (line: CartLineInput) => {
    void addSharedCartItem(sessionId, {
      guestId: myGuestId,
      menuItemId: line.menuItem.id,
      menuItemVariantId: line.variant?.id,
      modifierOptionIds: line.modifiers.map((m) => m.id),
      quantity: line.quantity,
      notes: line.notes || undefined,
    });
  };

  // A guest can only act on their own items (enforced server-side too) -
  // both quantity changes and removal go through remove(+re-add), since the
  // backend's shared cart has no update-in-place endpoint by design (every
  // add re-resolves current menu pricing).
  const updateQuantity = (lineId: string, quantity: number) => {
    const line = items.find((i) => i.id === lineId);
    if (!line || line.guestId !== myGuestId) return;
    void removeSharedCartItem(sessionId, lineId, myGuestId).then(() => {
      if (quantity > 0) {
        void addSharedCartItem(sessionId, {
          guestId: myGuestId,
          menuItemId: line.menuItemId,
          menuItemVariantId: line.menuItemVariantId ?? undefined,
          modifierOptionIds: line.modifierOptionIds ?? undefined,
          quantity,
          notes: line.notes ?? undefined,
        });
      }
    });
  };

  const removeLine = (lineId: string) => {
    const line = items.find((i) => i.id === lineId);
    if (!line || line.guestId !== myGuestId) return;
    void removeSharedCartItem(sessionId, lineId, myGuestId);
  };

  const submit = async () => {
    await submitTableSession(sessionId);
    // The order-tracking transition itself happens uniformly for every
    // guest (this phone included) via the 'cart-submitted' broadcast above,
    // not here - so a guest who submits sees the exact same round-trip as
    // everyone else at the table.
  };

  return (
    <CartContext.Provider value={{ lines, guests, addLine, updateQuantity, removeLine, subtotal, itemCount, submit }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
