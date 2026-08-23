import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../../common/enums/order.enum';

export interface TopItemRow {
  name: string;
  quantity: number;
  revenue: number;
}

export interface CustomerRetentionSummary {
  newCustomers: number;
  repeatCustomers: number;
  newRevenue: number;
  repeatRevenue: number;
}

export interface StaffPerformanceRow {
  staffId: string;
  fullName: string;
  orderCount: number;
  avgOrderValue: number;
}

const EXCLUDED_ORDER_STATUSES = [OrderStatus.CANCELLED];

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
  ) {}

  // Ranked by revenue (priceSnapshot * quantity, modifiers excluded - a
  // modifier isn't "the item," it's a customization of it) over the range,
  // scoped to one branch like every other Reports endpoint.
  async topItems(branchId: string, from: Date, to: Date, limit: number): Promise<TopItemRow[]> {
    const rows = await this.orderItems
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .select('item.nameSnapshot', 'name')
      .addSelect('SUM(item.quantity)', 'quantity')
      .addSelect('SUM(item.priceSnapshot * item.quantity)', 'revenue')
      .where('order.branchId = :branchId', { branchId })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('order.status NOT IN (:...excluded)', { excluded: EXCLUDED_ORDER_STATUSES })
      .groupBy('item.nameSnapshot')
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany<{ name: string; quantity: string; revenue: string }>();

    return rows.map((r) => ({ name: r.name, quantity: Number(r.quantity), revenue: Number(r.revenue) }));
  }

  // A customer (identified by phone, dine-in orders without one excluded)
  // is "repeat" if they have any order for this branch strictly before the
  // range starts, "new" otherwise - not just "placed more than one order
  // within the range," which would misclassify a genuinely new customer
  // who happened to order twice on their first visit.
  async customerRetention(branchId: string, from: Date, to: Date): Promise<CustomerRetentionSummary> {
    const ordersInRange = await this.orders
      .createQueryBuilder('order')
      .where('order.branchId = :branchId', { branchId })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('order.status NOT IN (:...excluded)', { excluded: EXCLUDED_ORDER_STATUSES })
      .andWhere('order.customerPhone IS NOT NULL')
      .select(['order.customerPhone', 'order.total'])
      .getMany();

    if (ordersInRange.length === 0) {
      return { newCustomers: 0, repeatCustomers: 0, newRevenue: 0, repeatRevenue: 0 };
    }

    const phones = [...new Set(ordersInRange.map((o) => o.customerPhone as string))];
    const priorOrderPhones = await this.orders
      .createQueryBuilder('order')
      .select('DISTINCT order.customerPhone', 'customerPhone')
      .where('order.branchId = :branchId', { branchId })
      .andWhere('order.createdAt < :from', { from })
      .andWhere('order.customerPhone IN (:...phones)', { phones })
      .getRawMany<{ customerPhone: string }>();
    const repeatPhones = new Set(priorOrderPhones.map((r) => r.customerPhone));

    let newCustomers = 0;
    let repeatCustomers = 0;
    let newRevenue = 0;
    let repeatRevenue = 0;
    const seen = new Set<string>();
    for (const order of ordersInRange) {
      const phone = order.customerPhone as string;
      const isRepeat = repeatPhones.has(phone);
      if (!seen.has(phone)) {
        seen.add(phone);
        isRepeat ? repeatCustomers++ : newCustomers++;
      }
      if (isRepeat) repeatRevenue += Number(order.total);
      else newRevenue += Number(order.total);
    }

    return { newCustomers, repeatCustomers, newRevenue, repeatRevenue };
  }

  // Two groupings, not one - a waiter takes orders, a cashier closes
  // checks, and the same person can hold either role on a given order (or
  // neither, for a mobile/QR order nobody took on a guest's behalf).
  async staffPerformance(branchId: string, from: Date, to: Date): Promise<{ waiters: StaffPerformanceRow[]; cashiers: StaffPerformanceRow[] }> {
    const [waiters, cashiers] = await Promise.all([
      this.groupByWaiter(branchId, from, to),
      this.groupByCashier(branchId, from, to),
    ]);
    return { waiters, cashiers };
  }

  private baseStaffQuery(branchId: string, from: Date, to: Date) {
    return this.orders
      .createQueryBuilder('order')
      .where('order.branchId = :branchId', { branchId })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('order.status NOT IN (:...excluded)', { excluded: EXCLUDED_ORDER_STATUSES });
  }

  private async groupByWaiter(branchId: string, from: Date, to: Date): Promise<StaffPerformanceRow[]> {
    const rows = await this.baseStaffQuery(branchId, from, to)
      .innerJoin('order.waiter', 'waiter')
      .select('order.waiterStaffId', 'staffId')
      .addSelect('waiter.fullName', 'fullName')
      .addSelect('COUNT(*)', 'orderCount')
      .addSelect('AVG(order.total)', 'avgOrderValue')
      .groupBy('order.waiterStaffId')
      .addGroupBy('waiter.fullName')
      .orderBy('orderCount', 'DESC')
      .getRawMany<{ staffId: string; fullName: string; orderCount: string; avgOrderValue: string }>();
    return rows.map((r) => ({ staffId: r.staffId, fullName: r.fullName, orderCount: Number(r.orderCount), avgOrderValue: Number(r.avgOrderValue) }));
  }

  private async groupByCashier(branchId: string, from: Date, to: Date): Promise<StaffPerformanceRow[]> {
    const rows = await this.baseStaffQuery(branchId, from, to)
      .innerJoin('order.cashier', 'cashier')
      .select('order.cashierStaffId', 'staffId')
      .addSelect('cashier.fullName', 'fullName')
      .addSelect('COUNT(*)', 'orderCount')
      .addSelect('AVG(order.total)', 'avgOrderValue')
      .groupBy('order.cashierStaffId')
      .addGroupBy('cashier.fullName')
      .orderBy('orderCount', 'DESC')
      .getRawMany<{ staffId: string; fullName: string; orderCount: string; avgOrderValue: string }>();
    return rows.map((r) => ({ staffId: r.staffId, fullName: r.fullName, orderCount: Number(r.orderCount), avgOrderValue: Number(r.avgOrderValue) }));
  }
}
