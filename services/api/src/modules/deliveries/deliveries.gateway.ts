import { OnEvent } from '@nestjs/event-emitter';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  DELIVERY_ASSIGNED,
  DELIVERY_STATUS_UPDATED,
  DeliveryAssignedEvent,
  DeliveryStatusUpdatedEvent,
} from './deliveries.events';

function driverRoom(driverStaffId: string): string {
  return `driver:${driverStaffId}`;
}

// The Rider app joins `driver:{staffId}` right after login so a new
// dispatch or a status change shows up live, the same way the Kitchen
// Display and Waiter POS get live updates instead of polling.
@WebSocketGateway({ namespace: 'deliveries', cors: { origin: '*' } })
export class DeliveriesGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('watch-driver')
  watchDriver(@ConnectedSocket() client: Socket, @MessageBody() data: { driverStaffId: string }): void {
    client.join(driverRoom(data.driverStaffId));
  }

  @OnEvent(DELIVERY_ASSIGNED)
  handleAssigned(event: DeliveryAssignedEvent): void {
    this.server.to(driverRoom(event.driverStaffId)).emit('delivery-assigned', event);
  }

  @OnEvent(DELIVERY_STATUS_UPDATED)
  handleStatusUpdated(event: DeliveryStatusUpdatedEvent): void {
    if (event.driverStaffId) {
      this.server.to(driverRoom(event.driverStaffId)).emit('delivery-status-changed', event);
    }
  }
}
