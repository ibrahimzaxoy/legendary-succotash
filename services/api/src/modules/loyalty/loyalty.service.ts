import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { LoyaltyAccount } from './entities/loyalty-account.entity';
import { LoyaltyLedgerEntry } from './entities/loyalty-ledger-entry.entity';
import { Branch } from '../branches/entities/branch.entity';
import { LoyaltyEntryType } from '../../common/enums/loyalty.enum';
import { AdjustLoyaltyPointsDto } from './dto/adjust-loyalty-points.dto';
import type { Order } from '../orders/entities/order.entity';
import type { Payment } from '../payments/entities/payment.entity';

// 1 point per $1 of order subtotal, 1 point worth $0.05 on redemption - a
// plain constant for v1, not a per-restaurant setting (see IMPLEMENTATION_PLAN.md §22).
const POINTS_PER_DOLLAR = 1;
const POINT_REDEMPTION_VALUE = 0.05;

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    @InjectRepository(LoyaltyAccount)
    private readonly accounts: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyLedgerEntry)
    private readonly ledger: Repository<LoyaltyLedgerEntry>,
    @InjectRepository(Branch)
    private readonly branches: Repository<Branch>,
  ) {}

  // Checkout-time balance preview - returns null (not a zero-balance
  // account) when this phone has never earned anything, so the client can
  // distinguish "first order" from "already spent everything."
  async lookup(branchId: string, phone: string): Promise<{ phone: string; name: string | null; pointsBalance: number } | null> {
    const restaurantId = await this.resolveRestaurantId(branchId);
    const account = await this.accounts.findOne({ where: { restaurantId, phone } });
    if (!account) return null;
    return { phone: account.phone, name: account.name, pointsBalance: account.pointsBalance };
  }

  findAccountsForRestaurant(restaurantId: string, search?: string): Promise<LoyaltyAccount[]> {
    return this.accounts.find({
      where: search ? { restaurantId, phone: Like(`%${search}%`) } : { restaurantId },
      order: { pointsBalance: 'DESC' },
      take: 100,
    });
  }

  // Called directly from PaymentsService.capture()/captureSplitEven()/
  // captureSplitByGuest() right after the receipt print call - same
  // direct-DI-call pattern as Purchasing -> Inventory (§14), not a new
  // event type. Never blocks or fails payment capture: caller wraps this
  // in a best-effort call and only logs a failure.
  async earnPoints(order: Order, payment: Payment): Promise<void> {
    if (!order.customerPhone) return; // no identity to credit
    const points = Math.floor(Number(order.subtotal) * POINTS_PER_DOLLAR);
    if (points <= 0) return;

    const account = await this.findOrCreateAccount(order.branchId, order.customerPhone, order.customerName);
    await this.applyLedgerEntry(account, LoyaltyEntryType.EARNED, points, order.id, `payment:${payment.id}`);
  }

  // Resolved at order-creation time (see OrdersService.createOrder), before
  // the total used for payment capture is computed - debits points
  // immediately rather than waiting for payment, since Order.discount has
  // to be set before recalcAndSave() runs.
  async redeemPoints(branchId: string, phone: string, points: number, orderId: string): Promise<{ discountAmount: string }> {
    if (points <= 0) throw new BadRequestException('redeemLoyaltyPoints must be positive');
    const restaurantId = await this.resolveRestaurantId(branchId);
    const account = await this.accounts.findOne({ where: { restaurantId, phone } });
    if (!account || account.pointsBalance < points) {
      throw new BadRequestException('Not enough loyalty points for this phone number');
    }

    await this.applyLedgerEntry(account, LoyaltyEntryType.REDEEMED, -points, orderId, `order:${orderId}`);
    return { discountAmount: (points * POINT_REDEMPTION_VALUE).toFixed(2) };
  }

  async adjustPoints(accountId: string, dto: AdjustLoyaltyPointsDto): Promise<LoyaltyAccount> {
    if (dto.points === 0) throw new BadRequestException('points must not be zero');
    const account = await this.accounts.findOne({ where: { id: accountId } });
    if (!account) throw new NotFoundException(`Loyalty account ${accountId} not found`);
    if (dto.points < 0 && account.pointsBalance + dto.points < 0) {
      throw new BadRequestException('Adjustment would take the balance negative');
    }
    return this.applyLedgerEntry(account, LoyaltyEntryType.ADJUSTED, dto.points, null, dto.note ?? null);
  }

  findLedgerForAccount(accountId: string): Promise<LoyaltyLedgerEntry[]> {
    return this.ledger.find({ where: { accountId }, order: { createdAt: 'DESC' } });
  }

  private async findOrCreateAccount(branchId: string, phone: string, name: string | null): Promise<LoyaltyAccount> {
    const restaurantId = await this.resolveRestaurantId(branchId);
    let account = await this.accounts.findOne({ where: { restaurantId, phone } });
    if (account) {
      if (name && account.name !== name) {
        account.name = name;
        account = await this.accounts.save(account);
      }
      return account;
    }
    try {
      return await this.accounts.save(this.accounts.create({ restaurantId, phone, name }));
    } catch (err) {
      // Two orders from a brand-new phone number captured back-to-back
      // could race on the (restaurantId, phone) unique index - the loser
      // just re-fetches the winner's row (same pattern as the table-session
      // guest race fixed in §18, but far lower-probability here since
      // payment capture is inherently a one-at-a-time cashier action).
      const driverCode = (err as { driverError?: { code?: string } }).driverError?.code;
      if (driverCode !== 'ER_DUP_ENTRY') throw err;
      const existing = await this.accounts.findOne({ where: { restaurantId, phone } });
      if (!existing) throw err;
      return existing;
    }
  }

  private async applyLedgerEntry(
    account: LoyaltyAccount,
    type: LoyaltyEntryType,
    points: number,
    orderId: string | null,
    note: string | null,
  ): Promise<LoyaltyAccount> {
    account.pointsBalance += points;
    const saved = await this.accounts.save(account);
    await this.ledger.save(this.ledger.create({ accountId: account.id, type, points, orderId, note }));
    return saved;
  }

  private async resolveRestaurantId(branchId: string): Promise<string> {
    const branch = await this.branches.findOne({ where: { id: branchId } });
    if (!branch) throw new NotFoundException(`Branch ${branchId} not found`);
    return branch.restaurantId;
  }
}
