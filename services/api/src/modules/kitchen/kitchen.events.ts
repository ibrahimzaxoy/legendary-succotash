// Internal event contracts published via @nestjs/event-emitter (EventEmitter2).
// This is the in-process stand-in for the "message broker" described in the
// architecture doc - swapping this for RabbitMQ later (when services split
// out of the monolith) means changing only where these are emitted/consumed,
// not the payload shapes.

export const ORDER_ITEM_CREATED = 'order.item.created';
export const ORDER_ITEM_STATUS_UPDATED = 'order.item.status.updated';
export const ORDER_READY = 'order.ready';

export interface OrderItemCreatedEvent {
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
  createdAt: Date;
}

export interface OrderItemStatusUpdatedEvent {
  branchId: string;
  stationId: string;
  orderId: string;
  orderItemId: string;
  status: string;
}

export interface OrderReadyEvent {
  branchId: string;
  orderId: string;
  tableId: string | null;
}
