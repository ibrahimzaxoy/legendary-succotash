export type Role = 'owner' | 'admin' | 'manager' | 'waiter' | 'cashier' | 'kitchen' | 'rider';

export interface StaffSummary {
  id: string;
  fullName: string;
  role: Role;
  restaurantId: string;
  branchId: string | null;
}

export interface StaffLoginOption {
  id: string;
  fullName: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  staff: StaffSummary;
}

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
}

export type TableStatus = 'free' | 'occupied' | 'needs_cleaning' | 'reserved';

export interface RestaurantTable {
  id: string;
  branchId: string;
  number: string;
  zone: string | null;
  capacity: number;
  status: TableStatus;
}

export type OrderChannel = 'mobile_delivery' | 'mobile_pickup' | 'dine_in_qr' | 'dine_in_waiter';
export type OrderStatus = 'open' | 'in_kitchen' | 'ready' | 'served' | 'out_for_delivery' | 'completed' | 'paid' | 'closed' | 'cancelled';
export type OrderItemStatus = 'queued' | 'cooking' | 'ready' | 'served' | 'cancelled';

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
  variants: MenuItemVariant[];
  modifierGroups: ModifierGroup[];
}

export interface OrderItemInput {
  menuItemId: string;
  menuItemVariantId?: string;
  modifierOptionIds?: string[];
  quantity: number;
  notes?: string;
}

export interface OrderItemModifierDto {
  id: string;
  nameSnapshot: string;
  priceSnapshot: string;
}

export interface OrderItemDto {
  id: string;
  orderId: string;
  nameSnapshot: string;
  quantity: number;
  notes: string | null;
  status: OrderItemStatus;
  createdAt: string;
  modifiers: OrderItemModifierDto[];
}

export interface OrderDto {
  id: string;
  branchId: string;
  channel: OrderChannel;
  tableId: string | null;
  status: OrderStatus;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  items: OrderItemDto[];
  createdAt: string;
  table: RestaurantTable | null;
}
