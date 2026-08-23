import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { DeliveryStatus } from '../../common/enums/payment.enum';
import { AuthenticatedStaff } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { DELIVERY_ASSIGNED, DELIVERY_STATUS_UPDATED } from './deliveries.events';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveries: Repository<Delivery>,
    private readonly events: EventEmitter2,
  ) {}

  create(dto: CreateDeliveryDto): Promise<Delivery> {
    return this.deliveries.save(this.deliveries.create(dto));
  }

  // Only drivers on-shift at this branch should be offered here - filtering
  // by active staff/branch happens in the Staff module the dashboard queries.
  async assignDriver(id: string, driverStaffId: string): Promise<Delivery> {
    const delivery = await this.updateStatus(id, DeliveryStatus.ASSIGNED, null, { driverStaffId });
    this.events.emit(DELIVERY_ASSIGNED, {
      deliveryId: delivery.id,
      branchId: delivery.branchId,
      driverStaffId,
    });
    return delivery;
  }

  // `requestingStaff` is null for internal calls (e.g. assignDriver, already
  // role-checked by the controller). When it's a rider, they may only move
  // their own deliveries - a manager/admin/owner can update any of them.
  async updateStatus(
    id: string,
    status: DeliveryStatus,
    requestingStaff: AuthenticatedStaff | null,
    extra: Partial<Pick<Delivery, 'driverStaffId'>> = {},
  ): Promise<Delivery> {
    const delivery = await this.findOne(id);
    if (requestingStaff?.role === Role.RIDER && delivery.driverStaffId !== requestingStaff.staffId) {
      throw new ForbiddenException('This delivery is not assigned to you');
    }

    delivery.status = status;
    Object.assign(delivery, extra);
    if (status === DeliveryStatus.PICKED_UP) delivery.pickedUpAt = new Date();
    if (status === DeliveryStatus.DELIVERED) delivery.deliveredAt = new Date();
    const saved = await this.deliveries.save(delivery);

    this.events.emit(DELIVERY_STATUS_UPDATED, {
      deliveryId: saved.id,
      branchId: saved.branchId,
      orderId: saved.orderId,
      driverStaffId: saved.driverStaffId,
      status: saved.status,
    });
    return saved;
  }

  findAllForBranch(branchId: string): Promise<Delivery[]> {
    return this.deliveries.find({ where: { branchId }, order: { assignedAt: 'DESC' } });
  }

  // What the Rider app loads: its own deliveries with the order (and its
  // items) attached - customer name/phone, address, total, and item count -
  // in one call, since the list view shows all of that without a second
  // round trip per delivery.
  findAllForDriver(driverStaffId: string): Promise<Delivery[]> {
    return this.deliveries.find({
      where: { driverStaffId },
      relations: ['order', 'order.items', 'order.items.modifiers'],
      order: { assignedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveries.findOne({ where: { id } });
    if (!delivery) {
      throw new NotFoundException(`Delivery ${id} not found`);
    }
    return delivery;
  }
}
