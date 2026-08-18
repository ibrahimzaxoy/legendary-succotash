import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  ORDER_ITEM_CREATED,
  ORDER_ITEM_STATUS_UPDATED,
  OrderItemCreatedEvent,
  OrderItemStatusUpdatedEvent,
} from './kitchen.events';

function stationRoom(branchId: string, stationId: string): string {
  return `station:${branchId}:${stationId}`;
}

// One wall-mounted screen per kitchen station connects here and joins only
// its own station's room, so a Hookah screen only ever receives Hookah
// tickets even though every order item for the branch flows through the
// same gateway.
@WebSocketGateway({ namespace: 'kitchen', cors: { origin: '*' } })
export class KitchenGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-station')
  joinStation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string; stationId: string },
  ): void {
    client.join(stationRoom(data.branchId, data.stationId));
  }

  @SubscribeMessage('leave-station')
  leaveStation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string; stationId: string },
  ): void {
    client.leave(stationRoom(data.branchId, data.stationId));
  }

  @OnEvent(ORDER_ITEM_CREATED)
  handleOrderItemCreated(event: OrderItemCreatedEvent): void {
    this.server.to(stationRoom(event.branchId, event.stationId)).emit('ticket-item-added', event);
  }

  @OnEvent(ORDER_ITEM_STATUS_UPDATED)
  handleOrderItemStatusUpdated(event: OrderItemStatusUpdatedEvent): void {
    this.server
      .to(stationRoom(event.branchId, event.stationId))
      .emit('ticket-item-status-changed', event);
  }
}
