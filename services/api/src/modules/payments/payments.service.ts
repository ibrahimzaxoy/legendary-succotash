import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { PaymentRefund } from './entities/payment-refund.entity';
import { CashDrawerSession } from './entities/cash-drawer-session.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { SplitByGuestDto, SplitEvenDto } from './dto/split-checkout.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { OpenCashDrawerDto } from './dto/open-cash-drawer.dto';
import { CloseCashDrawerDto } from './dto/close-cash-drawer.dto';
import { PaymentStatus, PaymentMethod, LedgerEntryType, CashDrawerSessionStatus } from '../../common/enums/payment.enum';
import { OrdersService } from '../orders/orders.service';
import { AccountingService } from '../accounting/accounting.service';
import { PrintingService } from '../printing/printing.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import type { Order } from '../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(PaymentAllocation)
    private readonly paymentAllocations: Repository<PaymentAllocation>,
    @InjectRepository(PaymentRefund)
    private readonly paymentRefunds: Repository<PaymentRefund>,
    @InjectRepository(CashDrawerSession)
    private readonly cashDrawerSessions: Repository<CashDrawerSession>,
    private readonly ordersService: OrdersService,
    private readonly accountingService: AccountingService,
    private readonly printingService: PrintingService,
    private readonly loyaltyService: LoyaltyService,
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
    void this.finalizeOrderMoney(order, saved);
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
    const receiptPayment = { method: dto.method, amount: order.total, tipAmount: '0' } as Payment;
    void this.printingService.printReceiptForOrder(order, receiptPayment);
    void this.finalizeOrderMoney(order, receiptPayment);
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
    const receiptPayment = { method: dto.method, amount: order.total, tipAmount: '0' } as Payment;
    void this.printingService.printReceiptForOrder(order, receiptPayment);
    void this.finalizeOrderMoney(order, receiptPayment);
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

  // Called once per order (not once per split payment) right after
  // closeOrder(), regardless of which of the three capture paths got there:
  // posts the DISCOUNT ledger entry for whatever loyalty/promo discount
  // OrdersService.createOrder() already resolved onto Order.discount (§22 -
  // this activates a ledger entry type that has existed since the original
  // Phase 4 design but had no writer until now), then credits loyalty
  // points for the sale. Both are best-effort - a failure here must never
  // undo a payment that already succeeded.
  private async finalizeOrderMoney(order: Order, payment: Payment): Promise<void> {
    try {
      if (Number(order.discount) > 0) {
        await this.accountingService.record(order.branchId, order.id, [
          { type: LedgerEntryType.DISCOUNT, amount: order.discount, note: `order:${order.id}` },
        ]);
      }
      await this.loyaltyService.earnPoints(order, payment);
    } catch (err) {
      this.logger.warn(`finalizeOrderMoney failed for order ${order.id}: ${(err as Error).message}`);
    }
  }

  findAllForOrder(orderId: string): Promise<Payment[]> {
    return this.payments.find({ where: { orderId } });
  }

  // --- Refunds ---
  // A refund is issued against an already-captured Payment, not the Order
  // itself - the order's own lifecycle (CLOSED) is untouched, consistent
  // with the ledger's "a correction is a new entry, never an edit to
  // history" philosophy (§10) applied one level down.

  async refund(paymentId: string, dto: RefundPaymentDto, staffId: string): Promise<PaymentRefund> {
    const payment = await this.payments.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);

    const amount = Number(dto.amount);
    if (amount <= 0) throw new BadRequestException('Refund amount must be positive');

    const alreadyRefunded = await this.totalRefunded(paymentId);
    const captured = Number(payment.amount) + Number(payment.tipAmount);
    const refundable = captured - alreadyRefunded;
    // A small epsilon guards against decimal rounding noise (e.g. a split
    // payment's amount was itself rounded) rejecting a legitimate
    // "refund everything remaining" request.
    if (amount > refundable + 0.01) {
      throw new BadRequestException(`Cannot refund more than ${refundable.toFixed(2)} remaining on this payment`);
    }

    const refund = await this.paymentRefunds.save(
      this.paymentRefunds.create({ paymentId, amount: dto.amount, reason: dto.reason ?? null, staffId }),
    );

    if (alreadyRefunded + amount >= captured - 0.01) {
      payment.status = PaymentStatus.REFUNDED;
      await this.payments.save(payment);
    }

    await this.accountingService.record(payment.branchId, payment.orderId, [
      { type: LedgerEntryType.REFUND, amount: dto.amount, note: `payment:${payment.id}${dto.reason ? ` · ${dto.reason}` : ''}` },
    ]);

    return refund;
  }

  findRefundsForPayment(paymentId: string): Promise<PaymentRefund[]> {
    return this.paymentRefunds.find({ where: { paymentId }, relations: ['staff'], order: { createdAt: 'DESC' } });
  }

  private async totalRefunded(paymentId: string): Promise<number> {
    const refunds = await this.paymentRefunds.find({ where: { paymentId } });
    return refunds.reduce((sum, r) => sum + Number(r.amount), 0);
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
  // during the session, minus every cash refund *this cashier issued*
  // during the session (a card refund never touches the physical drawer,
  // so only refunds against CASH payments count here - see refund()).
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

    const cashRefunds = await this.paymentRefunds
      .createQueryBuilder('refund')
      .innerJoin('refund.payment', 'payment')
      .where('refund.staffId = :staffId', { staffId: session.cashierStaffId })
      .andWhere('payment.method = :method', { method: PaymentMethod.CASH })
      .andWhere('refund.createdAt BETWEEN :openedAt AND :closedAt', { openedAt: session.openedAt, closedAt })
      .getMany();
    const cashRefunded = cashRefunds.reduce((sum, r) => sum + Number(r.amount), 0);

    const expectedClosingCash = Number(session.openingFloat) + cashTaken - cashRefunded;
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
