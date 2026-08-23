import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { CashDrawerSession } from './entities/cash-drawer-session.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { SplitByGuestDto, SplitEvenDto } from './dto/split-checkout.dto';
import { OpenCashDrawerDto } from './dto/open-cash-drawer.dto';
import { CloseCashDrawerDto } from './dto/close-cash-drawer.dto';
import { PaymentStatus, PaymentMethod, LedgerEntryType, CashDrawerSessionStatus } from '../../common/enums/payment.enum';
import { OrdersService } from '../orders/orders.service';
import { AccountingService } from '../accounting/accounting.service';
import { PrintingService } from '../printing/printing.service';
import type { Order } from '../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(PaymentAllocation)
    private readonly paymentAllocations: Repository<PaymentAllocation>,
    @InjectRepository(CashDrawerSession)
    private readonly cashDrawerSessions: Repository<CashDrawerSession>,
    private readonly ordersService: OrdersService,
    private readonly accountingService: AccountingService,
    private readonly printingService: PrintingService,
  ) {}

  // For dine-in this is only ever called with a cashierStaffId, resolved
  // from the authenticated Cashier's session - waiters cannot call this
  // directly for their own tables (see OrdersController role guards on
  // the mirrored close-check flow). Online mobile-app payments instead
  // arrive with an externalReference from the payment gateway webhook and
  // no cashierStaffId.
  async capture(dto: CreatePaymentDto, cashierStaffId: string | null): Promise<Payment> {
    const order = await this.ordersService.findOne(dto.orderId);
    const saved = await this.recordPayment(
      order,
      { method: dto.method, amount: dto.amount, tipAmount: dto.tipAmount, externalReference: dto.externalReference },
      cashierStaffId,
    );
    await this.ordersService.closeOrder(order.id, cashierStaffId);
    void this.printingService.printReceiptForOrder(order, saved);
    return saved;
  }

  // Split checkout, "split evenly": divides the total into `parts` equal
  // Payment rows (the last part absorbs any rounding remainder so the sum
  // always equals the order total exactly), then closes the order once.
  async captureSplitEven(dto: SplitEvenDto, cashierStaffId: string): Promise<Payment[]> {
    const order = await this.ordersService.findOne(dto.orderId);
    const total = Number(order.total);
    const amounts: number[] = [];
    let allocated = 0;
    for (let i = 0; i < dto.parts - 1; i++) {
      const amt = Math.round((total / dto.parts) * 100) / 100;
      amounts.push(amt);
      allocated += amt;
    }
    amounts.push(Math.round((total - allocated) * 100) / 100);

    const saved: Payment[] = [];
    for (const amount of amounts) {
      saved.push(await this.recordPayment(order, { method: dto.method, amount: amount.toFixed(2) }, cashierStaffId));
    }
    await this.ordersService.closeOrder(order.id, cashierStaffId);
    void this.printingService.printReceiptForOrder(order, { method: dto.method, amount: order.total, tipAmount: '0' } as Payment);
    return saved;
  }

  // Split checkout, "pay for your own items": groups the order's items by
  // OrderItem.orderedByGuestId (set when a shared table-session cart was
  // submitted - see TableSessionsService.submit), creates one Payment per
  // guest for exactly what they ordered, and itemizes each with
  // PaymentAllocation rows so it's traceable back to individual items.
  async captureSplitByGuest(dto: SplitByGuestDto, cashierStaffId: string): Promise<Payment[]> {
    const order = await this.ordersService.findOne(dto.orderId);
    const groups = new Map<string, typeof order.items>();
    for (const item of order.items) {
      const key = item.orderedByGuestId ?? 'ungrouped';
      const group = groups.get(key) ?? [];
      group.push(item);
      groups.set(key, group);
    }

    const saved: Payment[] = [];
    for (const items of groups.values()) {
      const itemTotals = items.map((item) => {
        const modifiersTotal = item.modifiers.reduce((sum, m) => sum + Number(m.priceSnapshot), 0);
        return { item, total: (Number(item.priceSnapshot) + modifiersTotal) * item.quantity };
      });
      const groupTotal = itemTotals.reduce((sum, t) => sum + t.total, 0);
      const payment = await this.recordPayment(order, { method: dto.method, amount: groupTotal.toFixed(2) }, cashierStaffId);
      saved.push(payment);

      const allocations = itemTotals.map(({ item, total }) =>
        this.paymentAllocations.create({ paymentId: payment.id, orderItemId: item.id, allocatedAmount: total.toFixed(2) }),
      );
      await this.paymentAllocations.save(allocations);
    }

    await this.ordersService.closeOrder(order.id, cashierStaffId);
    void this.printingService.printReceiptForOrder(order, { method: dto.method, amount: order.total, tipAmount: '0' } as Payment);
    return saved;
  }

  // Shared by capture()/captureSplitEven()/captureSplitByGuest() - creates
  // the Payment row and its ledger entries but never closes the order,
  // since a split checkout needs several of these before the order is
  // actually done.
  private async recordPayment(
    order: Order,
    input: { method: Payment['method']; amount: string; tipAmount?: string; externalReference?: string },
    cashierStaffId: string | null,
  ): Promise<Payment> {
    const payment = this.payments.create({
      orderId: order.id,
      branchId: order.branchId,
      cashierStaffId,
      method: input.method,
      status: PaymentStatus.CAPTURED,
      amount: input.amount,
      tipAmount: input.tipAmount ?? '0',
      externalReference: input.externalReference ?? null,
    });
    const saved = await this.payments.save(payment);

    await this.accountingService.record(order.branchId, order.id, [
      { type: LedgerEntryType.SALE, amount: input.amount, note: `payment:${saved.id}` },
      ...(input.tipAmount && Number(input.tipAmount) > 0
        ? [{ type: LedgerEntryType.TIP, amount: input.tipAmount, note: `payment:${saved.id}` }]
        : []),
    ]);

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
