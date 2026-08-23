import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CashDrawerSession } from './entities/cash-drawer-session.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { OpenCashDrawerDto } from './dto/open-cash-drawer.dto';
import { CloseCashDrawerDto } from './dto/close-cash-drawer.dto';
import { PaymentStatus, PaymentMethod, LedgerEntryType, CashDrawerSessionStatus } from '../../common/enums/payment.enum';
import { OrdersService } from '../orders/orders.service';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(CashDrawerSession)
    private readonly cashDrawerSessions: Repository<CashDrawerSession>,
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

  // --- Cash drawer reconciliation ---

  async openCashDrawer(dto: OpenCashDrawerDto, cashierStaffId: string): Promise<CashDrawerSession> {
    const existing = await this.cashDrawerSessions.findOne({
      where: { cashierStaffId, status: CashDrawerSessionStatus.OPEN },
    });
    if (existing) {
      throw new BadRequestException('Already have an open cash drawer session - close it first');
    }
    return this.cashDrawerSessions.save(
      this.cashDrawerSessions.create({ branchId: dto.branchId, cashierStaffId, openingFloat: dto.openingFloat }),
    );
  }

  findOpenCashDrawerForCashier(cashierStaffId: string): Promise<CashDrawerSession | null> {
    return this.cashDrawerSessions.findOne({ where: { cashierStaffId, status: CashDrawerSessionStatus.OPEN } });
  }

  // Expected cash = opening float + every cash payment (sale + tip) taken
  // during the session. No refund flow exists yet in this system, so
  // there's nothing to subtract for refunds today - see the plan's "not
  // yet implemented" list.
  async closeCashDrawer(id: string, dto: CloseCashDrawerDto): Promise<CashDrawerSession> {
    const session = await this.cashDrawerSessions.findOne({ where: { id } });
    if (!session) throw new NotFoundException(`Cash drawer session ${id} not found`);
    if (session.status !== CashDrawerSessionStatus.OPEN) {
      throw new BadRequestException('Cash drawer session is already closed');
    }

    const closedAt = new Date();
    const cashPayments = await this.payments.find({
      where: { cashierStaffId: session.cashierStaffId, method: PaymentMethod.CASH, createdAt: Between(session.openedAt, closedAt) },
    });
    const cashTaken = cashPayments.reduce((sum, p) => sum + Number(p.amount) + Number(p.tipAmount), 0);
    const expectedClosingCash = Number(session.openingFloat) + cashTaken;
    const variance = Number(dto.countedClosingCash) - expectedClosingCash;

    session.closedAt = closedAt;
    session.expectedClosingCash = expectedClosingCash.toFixed(2);
    session.countedClosingCash = dto.countedClosingCash;
    session.variance = variance.toFixed(2);
    session.varianceNote = dto.varianceNote ?? null;
    session.status = CashDrawerSessionStatus.CLOSED;
    const saved = await this.cashDrawerSessions.save(session);

    // Logged even at zero variance for a complete audit trail of every
    // session that ever ran - the reporting UI only visually flags non-zero ones.
    await this.accountingService.record(session.branchId, null, [
      { type: LedgerEntryType.CASH_DRAWER_VARIANCE, amount: variance.toFixed(2), note: `cash_drawer_session:${session.id}` },
    ]);

    return saved;
  }

  findCashDrawerSessionsForBranch(branchId: string): Promise<CashDrawerSession[]> {
    return this.cashDrawerSessions.find({ where: { branchId }, relations: ['cashier'], order: { openedAt: 'DESC' } });
  }
}
