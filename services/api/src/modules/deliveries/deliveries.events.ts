import { DeliveryStatus } from '../../common/enums/payment.enum';

// In-process event contracts (see kitchen.events.ts for the pattern this
// mirrors) so the Rider app's WebSocket gateway doesn't need to poll for
// new dispatches or status changes made from elsewhere (e.g. a manager
// updating status from the Management Dashboard).

export const DELIVERY_ASSIGNED = 'delivery.assigned';
export const DELIVERY_STATUS_UPDATED = 'delivery.status.updated';

export interface DeliveryAssignedEvent {
  deliveryId: string;
  branchId: string;
  driverStaffId: string;
}

export interface DeliveryStatusUpdatedEvent {
  deliveryId: string;
  branchId: string;
  orderId: string;
  driverStaffId: string | null;
  status: DeliveryStatus;
}
