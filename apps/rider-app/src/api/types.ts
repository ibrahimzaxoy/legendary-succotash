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

export type OrderChannel = 'mobile_delivery' | 'mobile_pickup' | 'dine_in_qr' | 'dine_in_waiter';
export type OrderStatus = 'open' | 'in_kitchen' | 'ready' | 'served' | 'out_for_delivery' | 'completed' | 'paid' | 'closed' | 'cancelled';
export type OrderItemStatus = 'queued' | 'cooking' | 'ready' | 'served' | 'cancelled';

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
  modifiers: OrderItemModifierDto[];
}

export interface OrderDto {
  id: string;
  branchId: string;
  channel: OrderChannel;
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  items: OrderItemDto[];
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
  fee: string;
  assignedAt: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  order: OrderDto;
}
