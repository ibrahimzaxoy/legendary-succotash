import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ORDER_ITEM_STATUS_UPDATED, ORDER_READY, OrderItemStatusUpdatedEvent, OrderReadyEvent } from '../kitchen/kitchen.events';
import {
  SHARED_CART_ITEM_ADDED,
  SHARED_CART_ITEM_REMOVED,
  SHARED_CART_SUBMITTED,
  TABLE_SESSION_GUEST_JOINED,
  SharedCartItemAddedEvent,
  SharedCartItemRemovedEvent,
  SharedCartSubmittedEvent,
  TableSessionGuestJoinedEvent,
} from '../tables/table-sessions.events';

function orderRoom(orderId: string): string {
  return `order:${orderId}`;
}

function floorRoom(branchId: string): string {
  return `branch:${branchId}:floor`;
}

function tableSessionRoom(tableId: string): string {
  return `table-session:${tableId}`;
}

// Customer-facing order tracking (table PWA, mobile app) joins `order:{id}`.
// Waiter/cashier floor views join `branch:{id}:floor` to see every table's
// order move through statuses without polling.
@WebSocketGateway({ namespace: 'orders', cors: { origin: '*' } })
export class OrdersGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('watch-order')
  watchOrder(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }): void {
    client.join(orderRoom(data.orderId));
  }

  @SubscribeMessage('watch-floor')
  watchFloor(@ConnectedSocket() client: Socket, @MessageBody() data: { branchId: string }): void {
    client.join(floorRoom(data.branchId));
  }

  // Every guest phone at a table joins this room on load - see
  // TableSessionsService, which owns all the actual session/cart logic and
  // only ever talks to EventEmitter2, never to Socket.IO directly.
  @SubscribeMessage('watch-table-session')
  watchTableSession(@ConnectedSocket() client: Socket, @MessageBody() data: { tableId: string }): void {
    client.join(tableSessionRoom(data.tableId));
  }

  @OnEvent(ORDER_ITEM_STATUS_UPDATED)
  handleItemStatusUpdated(event: OrderItemStatusUpdatedEvent): void {
    this.server.to(orderRoom(event.orderId)).emit('item-status-changed', event);
    this.server.to(floorRoom(event.branchId)).emit('item-status-changed', event);
  }

  @OnEvent(ORDER_READY)
  handleOrderReady(event: OrderReadyEvent): void {
    this.server.to(orderRoom(event.orderId)).emit('order-ready', event);
    this.server.to(floorRoom(event.branchId)).emit('order-ready', event);
  }

  @OnEvent(TABLE_SESSION_GUEST_JOINED)
  handleGuestJoined(event: TableSessionGuestJoinedEvent): void {
    this.server.to(tableSessionRoom(event.tableId)).emit('guest-joined', event);
  }

  @OnEvent(SHARED_CART_ITEM_ADDED)
  handleCartItemAdded(event: SharedCartItemAddedEvent): void {
    this.server.to(tableSessionRoom(event.tableId)).emit('cart-item-added', event);
  }

  @OnEvent(SHARED_CART_ITEM_REMOVED)
  handleCartItemRemoved(event: SharedCartItemRemovedEvent): void {
    this.server.to(tableSessionRoom(event.tableId)).emit('cart-item-removed', event);
  }

  @OnEvent(SHARED_CART_SUBMITTED)
  handleCartSubmitted(event: SharedCartSubmittedEvent): void {
    this.server.to(tableSessionRoom(event.tableId)).emit('cart-submitted', event);
  }
}
