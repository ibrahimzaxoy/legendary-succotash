// Mirrors the shapes returned by services/api. Kept intentionally narrow to
// what this app actually reads/writes rather than the full backend entity.

export type OrderChannel = 'mobile_delivery' | 'mobile_pickup' | 'dine_in_qr' | 'dine_in_waiter';

export type OrderStatus =
  | 'open'
  | 'in_kitchen'
  | 'ready'
  | 'served'
  | 'out_for_delivery'
  | 'completed'
  | 'paid'
  | 'closed'
  | 'cancelled';

export type OrderItemStatus = 'queued' | 'cooking' | 'ready' | 'served' | 'cancelled';

export interface TableScanResult {
  id: string;
  number: string;
  branchId: string;
  status: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: string;
}

export interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
}

export interface MenuItemVariant {
  id: string;
  name: string;
  priceDelta: string;
  isDefault: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  kitchenStationId: string;
  name: string;
  description: string | null;
  basePrice: string;
  imageUrl: string | null;
  isAvailable: boolean;
  prepTimeMinutes: number;
  variants: MenuItemVariant[];
  modifierGroups: ModifierGroup[];
}

export interface OrderItemModifier {
  id: string;
  nameSnapshot: string;
  priceSnapshot: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  nameSnapshot: string;
  priceSnapshot: string;
  quantity: number;
  status: OrderItemStatus;
  notes: string | null;
  modifiers: OrderItemModifier[];
}

export interface Order {
  id: string;
  branchId: string;
  channel: OrderChannel;
  tableId: string | null;
  status: OrderStatus;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItemInput {
  menuItemId: string;
  menuItemVariantId?: string;
  modifierOptionIds?: string[];
  quantity: number;
  notes?: string;
}

// --- Shared table session (multi-guest QR ordering) ---
// Deliberately named distinctly from the device-local `TableSession` in
// utils/storage.ts (which is just this phone's remembered QR scan) - a
// GuestSession is the server-side, multi-phone-shared dining occupancy.

export interface Guest {
  id: string;
  guestLabel: string;
}

export interface SharedCartItem {
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
}

export interface GuestSessionState {
  session: { id: string; tableId: string; status: 'active' | 'closed' };
  guest: Guest;
  guests: Guest[];
  cartItems: SharedCartItem[];
}
