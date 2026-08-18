import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus, LedgerEntryType } from '../../common/enums/payment.enum';
import { OrdersService } from '../orders/orders.service';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    private readonly ordersService: OrdersService,
    private readonly accountingService: AccountingService,
  ) {}

  // For dine-in this is only ever called with a cashierStaffId, resolved
  // from the authenticated Cashier's session - waiters cannot call this
  // directly for their own tables (see OrdersController role guards on
  // the mirrored close-check flow). Online mobile-app payments instead
  // arrive with an externalReference from the payment gateway webhook and
  // no cashierStaffId.
  async capture(dto: CreatePaymentDto, cashierStaffId: string | null): Promise<Payment> {
    const order = await this.ordersService.findOne(dto.orderId);

    const payment = this.payments.create({
      orderId: dto.orderId,
      branchId: order.branchId,
      cashierStaffId,
      method: dto.method,
      status: PaymentStatus.CAPTURED,
      amount: dto.amount,
      tipAmount: dto.tipAmount ?? '0',
      externalReference: dto.externalReference ?? null,
    });
    const saved = await this.payments.save(payment);

    await this.accountingService.record(order.branchId, order.id, [
      { type: LedgerEntryType.SALE, amount: dto.amount, note: `payment:${saved.id}` },
      ...(dto.tipAmount && Number(dto.tipAmount) > 0
        ? [{ type: LedgerEntryType.TIP, amount: dto.tipAmount, note: `payment:${saved.id}` }]
        : []),
    ]);

    await this.ordersService.closeOrder(order.id, cashierStaffId);

    return saved;
  }

  findAllForOrder(orderId: string): Promise<Payment[]> {
    return this.payments.find({ where: { orderId } });
  }
}
