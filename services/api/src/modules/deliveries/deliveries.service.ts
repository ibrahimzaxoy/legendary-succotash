import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { DeliveryStatus } from '../../common/enums/payment.enum';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveries: Repository<Delivery>,
  ) {}

  create(dto: CreateDeliveryDto): Promise<Delivery> {
    return this.deliveries.save(this.deliveries.create(dto));
  }

  // Only drivers on-shift at this branch should be offered here - filtering
  // by active staff/branch happens in the Staff module the dashboard queries.
  assignDriver(id: string, driverStaffId: string): Promise<Delivery> {
    return this.updateStatus(id, DeliveryStatus.ASSIGNED, { driverStaffId });
  }

  async updateStatus(
    id: string,
    status: DeliveryStatus,
    extra: Partial<Pick<Delivery, 'driverStaffId'>> = {},
  ): Promise<Delivery> {
    const delivery = await this.findOne(id);
    delivery.status = status;
    Object.assign(delivery, extra);
    if (status === DeliveryStatus.PICKED_UP) delivery.pickedUpAt = new Date();
    if (status === DeliveryStatus.DELIVERED) delivery.deliveredAt = new Date();
    return this.deliveries.save(delivery);
  }

  findAllForBranch(branchId: string): Promise<Delivery[]> {
    return this.deliveries.find({ where: { branchId }, order: { assignedAt: 'DESC' } });
  }

  findAllForDriver(driverStaffId: string): Promise<Delivery[]> {
    return this.deliveries.find({ where: { driverStaffId }, order: { assignedAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveries.findOne({ where: { id } });
    if (!delivery) {
      throw new NotFoundException(`Delivery ${id} not found`);
    }
    return delivery;
  }
}
