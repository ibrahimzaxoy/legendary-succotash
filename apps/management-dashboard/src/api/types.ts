export type Role = 'owner' | 'admin' | 'manager' | 'waiter' | 'cashier' | 'kitchen' | 'rider';

export interface StaffSummary {
  id: string;
  fullName: string;
  role: Role;
  restaurantId: string;
  branchId: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  staff: StaffSummary;
}

export interface Restaurant {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  address: string;
  phone: string | null;
}

export interface Staff {
  id: string;
  restaurantId: string;
  branchId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  active: boolean;
  onShift: boolean;
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

export interface KitchenStation {
  id: string;
  branchId: string;
  name: string;
  isExpo: boolean;
  sortOrder: number;
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
  branchId: string;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  branchId: string;
  categoryId: string;
  kitchenStationId: string;
  name: string;
  description: string | null;
  basePrice: string;
  imageUrl: string | null;
  isAvailable: boolean;
  availableDineIn: boolean;
  availablePickup: boolean;
  availableDelivery: boolean;
  prepTimeMinutes: number;
  variants: MenuItemVariant[];
  modifierGroups: ModifierGroup[];
  kitchenStation: KitchenStation;
}

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

export interface OrderItem {
  id: string;
  nameSnapshot: string;
  quantity: number;
  status: OrderItemStatus;
}

export interface Order {
  id: string;
  branchId: string;
  channel: OrderChannel;
  status: OrderStatus;
  subtotal: string;
  total: string;
  customerName: string | null;
  deliveryAddress: string | null;
  tableId: string | null;
  table: RestaurantTable | null;
  items: OrderItem[];
  createdAt: string;
}

export type DeliveryStatus = 'assigned' | 'picked_up' | 'en_route' | 'delivered' | 'failed';

export interface Delivery {
  id: string;
  orderId: string;
  branchId: string;
  driverStaffId: string | null;
  address: string;
  status: DeliveryStatus;
}

export interface AccountingSummary {
  branchId: string;
  from: string;
  to: string;
  totals: Record<string, number>;
}
