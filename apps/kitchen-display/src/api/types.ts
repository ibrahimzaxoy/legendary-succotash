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

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
}

export interface KitchenStation {
  id: string;
  branchId: string;
  name: string;
  isExpo: boolean;
  sortOrder: number;
}

export type TicketItemStatus = 'queued' | 'cooking' | 'ready' | 'served' | 'cancelled';

// Unified shape this app renders from, regardless of whether a ticket came
// from the initial REST fetch (GET /orders/stations/:id/items) or a live
// WebSocket event - see src/api/ticket.ts for the two mapping functions.
export interface Ticket {
  orderItemId: string;
  orderId: string;
  channel: string;
  tableNumber: string | null;
  name: string;
  quantity: number;
  notes: string | null;
  modifiers: string[];
  status: TicketItemStatus;
  createdAt: string;
}

// Raw REST shape from GET /orders/stations/:stationId/items
export interface OrderItemDto {
  id: string;
  orderId: string;
  nameSnapshot: string;
  quantity: number;
  notes: string | null;
  status: TicketItemStatus;
  createdAt: string;
  modifiers: { nameSnapshot: string }[];
  order: {
    channel: string;
    table: { number: string } | null;
  };
}

// Raw WebSocket event shapes (kitchen.events.ts on the backend)
export interface TicketItemAddedEvent {
  branchId: string;
  stationId: string;
  orderId: string;
  orderItemId: string;
  channel: string;
  tableNumber: string | null;
  name: string;
  quantity: number;
  notes: string | null;
  modifiers: string[];
  createdAt: string;
}

export interface TicketItemStatusChangedEvent {
  branchId: string;
  stationId: string;
  orderId: string;
  orderItemId: string;
  status: TicketItemStatus;
}
