// Relayed onto the `table-session:{tableId}` WebSocket room by OrdersGateway
// (see orders.gateway.ts) - the same event-bus-to-socket-room pattern the
// kitchen module already uses, so TablesModule never needs to know about
// Socket.IO at all.

export const TABLE_SESSION_GUEST_JOINED = 'table-session.guest.joined';
export const SHARED_CART_ITEM_ADDED = 'table-session.cart-item.added';
export const SHARED_CART_ITEM_REMOVED = 'table-session.cart-item.removed';
export const SHARED_CART_SUBMITTED = 'table-session.cart.submitted';

export interface TableSessionGuestJoinedEvent {
  tableId: string;
  guest: { id: string; guestLabel: string };
}

export interface SharedCartItemAddedEvent {
  tableId: string;
  item: {
    id: string;
    guestId: string;
    menuItemId: string;
    menuItemVariantId: string | null;
    modifierOptionIds: string[] | null;
    nameSnapshot: string;
    unitPriceSnapshot: string;
    modifierNamesSnapshot: string[] | null;
    quantity: number;
    notes: string | null;
  };
}

export interface SharedCartItemRemovedEvent {
  tableId: string;
  itemId: string;
}

// One guest submitting the shared cart should move every guest's phone into
// order tracking together, not just the one who tapped submit.
export interface SharedCartSubmittedEvent {
  tableId: string;
  orderId: string;
}
