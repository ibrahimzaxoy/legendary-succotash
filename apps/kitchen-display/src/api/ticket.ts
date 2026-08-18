import type { OrderItemDto, Ticket, TicketItemAddedEvent } from './types';

export function ticketFromOrderItemDto(item: OrderItemDto): Ticket {
  return {
    orderItemId: item.id,
    orderId: item.orderId,
    channel: item.order.channel,
    tableNumber: item.order.table?.number ?? null,
    name: item.nameSnapshot,
    quantity: item.quantity,
    notes: item.notes,
    modifiers: item.modifiers.map((m) => m.nameSnapshot),
    status: item.status,
    createdAt: item.createdAt,
  };
}

export function ticketSourceLabel(ticket: Ticket): string {
  if (ticket.tableNumber) return `Table ${ticket.tableNumber}`;
  if (ticket.channel === 'mobile_pickup') return 'Pickup';
  if (ticket.channel === 'mobile_delivery') return 'Delivery';
  return 'Order';
}

export function ticketFromAddedEvent(evt: TicketItemAddedEvent): Ticket {
  return {
    orderItemId: evt.orderItemId,
    orderId: evt.orderId,
    channel: evt.channel,
    tableNumber: evt.tableNumber,
    name: evt.name,
    quantity: evt.quantity,
    notes: evt.notes,
    modifiers: evt.modifiers,
    status: 'queued',
    createdAt: evt.createdAt,
  };
}
