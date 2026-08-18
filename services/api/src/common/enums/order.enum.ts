export enum OrderChannel {
  MOBILE_DELIVERY = 'mobile_delivery',
  MOBILE_PICKUP = 'mobile_pickup',
  DINE_IN_QR = 'dine_in_qr',
  DINE_IN_WAITER = 'dine_in_waiter',
}

// Order-level status. Item-level detail (queued/cooking/ready) lives on
// OrderItem.status and is what actually drives the Kitchen Display System -
// this is the coarser status used for the floor view, tracking screen, etc.
export enum OrderStatus {
  OPEN = 'open',
  IN_KITCHEN = 'in_kitchen',
  READY = 'ready',
  SERVED = 'served',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  COMPLETED = 'completed',
  PAID = 'paid',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum OrderItemStatus {
  QUEUED = 'queued',
  COOKING = 'cooking',
  READY = 'ready',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export enum TableStatus {
  FREE = 'free',
  OCCUPIED = 'occupied',
  NEEDS_CLEANING = 'needs_cleaning',
  RESERVED = 'reserved',
}
