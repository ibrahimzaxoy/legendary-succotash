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

function orderRoom(orderId: string): string {
  return `order:${orderId}`;
}

function floorRoom(branchId: string): string {
  return `branch:${branchId}:floor`;
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
}
