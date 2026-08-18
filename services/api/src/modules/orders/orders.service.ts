import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { In, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemModifier } from './entities/order-item-modifier.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { RestaurantTable } from '../tables/entities/table.entity';
import { CreateOrderDto, OrderItemInputDto } from './dto/create-order.dto';
import { AddOrderItemsDto } from './dto/add-order-items.dto';
import { OrderChannel, OrderItemStatus, OrderStatus, TableStatus } from '../../common/enums/order.enum';
import {
  ORDER_ITEM_CREATED,
  ORDER_ITEM_STATUS_UPDATED,
  ORDER_READY,
  OrderItemCreatedEvent,
} from '../kitchen/kitchen.events';

const ITEM_TERMINAL_STATUSES = [OrderItemStatus.READY, OrderItemStatus.SERVED, OrderItemStatus.CANCELLED];
// An order is "on the floor" - still being cooked, served, or awaiting the
// cashier - for exactly these statuses; CLOSED/CANCELLED/PAID are done.
const ACTIVE_ORDER_STATUSES = [OrderStatus.OPEN, OrderStatus.IN_KITCHEN, OrderStatus.READY, OrderStatus.SERVED];

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(OrderItemModifier)
    private readonly orderItemModifiers: Repository<OrderItemModifier>,
    @InjectRepository(MenuItem)
    private readonly menuItems: Repository<MenuItem>,
    @InjectRepository(RestaurantTable)
    private readonly tables: Repository<RestaurantTable>,
    private readonly events: EventEmitter2,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    if ((dto.channel === OrderChannel.DINE_IN_QR || dto.channel === OrderChannel.DINE_IN_WAITER) && !dto.tableId) {
      throw new BadRequestException('tableId is required for dine-in orders');
    }

    const order = this.orders.create({
      branchId: dto.branchId,
      channel: dto.channel,
      tableId: dto.tableId ?? null,
      waiterStaffId: dto.waiterStaffId ?? null,
      customerName: dto.customerName ?? null,
      customerPhone: dto.customerPhone ?? null,
      deliveryAddress: dto.deliveryAddress ?? null,
      status: OrderStatus.OPEN,
    });
    const saved = await this.orders.save(order);

    await this.appendItems(saved, dto.items);
    saved.status = OrderStatus.IN_KITCHEN;
    await this.recalcAndSave(saved);

    // A table only ever becomes OCCUPIED because an order was opened on it -
    // never set by hand (see SetTableStatusDto).
    if (saved.tableId) {
      await this.tables.update(saved.tableId, { status: TableStatus.OCCUPIED });
    }

    return this.findOne(saved.id);
  }

  async addItems(orderId: string, dto: AddOrderItemsDto): Promise<Order> {
    const order = await this.getOrderOrThrow(orderId);
    if ([OrderStatus.CLOSED, OrderStatus.CANCELLED, OrderStatus.PAID].includes(order.status)) {
      throw new BadRequestException(`Cannot add items to an order in status ${order.status}`);
    }
    if (dto.waiterStaffId && !order.waiterStaffId) {
      order.waiterStaffId = dto.waiterStaffId;
    }
    await this.appendItems(order, dto.items);
    order.status = OrderStatus.IN_KITCHEN;
    await this.recalcAndSave(order);
    return this.findOne(order.id);
  }

  private async appendItems(order: Order, inputs: OrderItemInputDto[]): Promise<void> {
    // Resolved once per call (not per item) so every ticket in this batch
    // carries the table number the Kitchen Display shows on its cards.
    const table = order.tableId ? await this.tables.findOne({ where: { id: order.tableId } }) : null;

    for (const input of inputs) {
      const menuItem = await this.menuItems.findOne({
        where: { id: input.menuItemId },
        relations: ['variants', 'modifierGroups', 'modifierGroups.options', 'kitchenStation'],
      });
      if (!menuItem || !menuItem.isAvailable) {
        throw new BadRequestException(`Menu item ${input.menuItemId} is not available`);
      }

      let unitPrice = Number(menuItem.basePrice);
      let variant = null as (typeof menuItem.variants)[number] | null;
      if (input.menuItemVariantId) {
        variant = menuItem.variants.find((v) => v.id === input.menuItemVariantId) ?? null;
        if (!variant) {
          throw new BadRequestException(`Variant ${input.menuItemVariantId} does not belong to menu item`);
        }
        unitPrice += Number(variant.priceDelta);
      }

      const orderItem = this.orderItems.create({
        orderId: order.id,
        menuItemId: menuItem.id,
        menuItemVariantId: variant?.id ?? null,
        kitchenStationId: menuItem.kitchenStationId,
        nameSnapshot: variant ? `${menuItem.name} (${variant.name})` : menuItem.name,
        priceSnapshot: unitPrice.toFixed(2),
        quantity: input.quantity,
        status: OrderItemStatus.QUEUED,
        notes: input.notes ?? null,
      });
      const savedItem = await this.orderItems.save(orderItem);

      const modifierNames: string[] = [];
      if (input.modifierOptionIds?.length) {
        const allOptions = menuItem.modifierGroups.flatMap((g) => g.options);
        const modifiers = input.modifierOptionIds.map((optionId) => {
          const option = allOptions.find((o) => o.id === optionId);
          if (!option) {
            throw new BadRequestException(`Modifier option ${optionId} does not belong to menu item`);
          }
          modifierNames.push(option.name);
          return this.orderItemModifiers.create({
            orderItemId: savedItem.id,
            modifierOptionId: option.id,
            nameSnapshot: option.name,
            priceSnapshot: option.priceDelta,
          });
        });
        await this.orderItemModifiers.save(modifiers);
      }

      const event: OrderItemCreatedEvent = {
        branchId: order.branchId,
        stationId: menuItem.kitchenStationId,
        orderId: order.id,
        orderItemId: savedItem.id,
        channel: order.channel,
        tableNumber: table?.number ?? null,
        name: savedItem.nameSnapshot,
        quantity: savedItem.quantity,
        notes: savedItem.notes,
        modifiers: modifierNames,
        createdAt: savedItem.createdAt,
      };
      this.events.emit(ORDER_ITEM_CREATED, event);
    }
  }

  async updateItemStatus(orderItemId: string, status: OrderItemStatus): Promise<OrderItem> {
    const item = await this.orderItems.findOne({ where: { id: orderItemId } });
    if (!item) {
      throw new NotFoundException(`Order item ${orderItemId} not found`);
    }
    item.status = status;
    const saved = await this.orderItems.save(item);

    this.events.emit(ORDER_ITEM_STATUS_UPDATED, {
      branchId: (await this.getOrderOrThrow(item.orderId)).branchId,
      stationId: item.kitchenStationId,
      orderId: item.orderId,
      orderItemId: item.id,
      status: item.status,
    });

    await this.maybeMarkOrderReady(item.orderId);
    return saved;
  }

  private async maybeMarkOrderReady(orderId: string): Promise<void> {
    const order = await this.getOrderOrThrow(orderId);
    if (order.status !== OrderStatus.IN_KITCHEN) {
      return;
    }
    const items = await this.orderItems.find({ where: { orderId } });
    const allDone = items.length > 0 && items.every((i) => ITEM_TERMINAL_STATUSES.includes(i.status));
    if (allDone) {
      order.status = OrderStatus.READY;
      await this.orders.save(order);
      this.events.emit(ORDER_READY, { branchId: order.branchId, orderId: order.id, tableId: order.tableId });
    }
  }

  private async recalcAndSave(order: Order): Promise<void> {
    const items = await this.orderItems.find({ where: { orderId: order.id }, relations: ['modifiers'] });
    let subtotal = 0;
    for (const item of items) {
      const modifiersTotal = item.modifiers.reduce((sum, m) => sum + Number(m.priceSnapshot), 0);
      subtotal += (Number(item.priceSnapshot) + modifiersTotal) * item.quantity;
    }
    order.subtotal = subtotal.toFixed(2);
    order.total = (subtotal - Number(order.discount) + Number(order.tax)).toFixed(2);
    await this.orders.save(order);
  }

  findAllForBranch(branchId: string, status?: OrderStatus): Promise<Order[]> {
    return this.orders.find({
      where: status ? { branchId, status } : { branchId },
      relations: ['items', 'items.modifiers', 'table'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orders.findOne({
      where: { id },
      relations: ['items', 'items.modifiers', 'items.kitchenStation', 'table', 'waiter', 'cashier'],
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  // Lets the table PWA (or a waiter re-opening a table) find the order a
  // table is already mid-way through, so a second phone scanning the same
  // table's QR appends to that order instead of starting a duplicate one.
  async findActiveForTable(branchId: string, tableId: string): Promise<Order | null> {
    return this.orders.findOne({
      where: { branchId, tableId, status: In(ACTIVE_ORDER_STATUSES) },
      relations: ['items', 'items.modifiers', 'items.kitchenStation', 'table'],
      order: { createdAt: 'DESC' },
    });
  }

  // What the Waiter POS floor view fetches to know, per table, whether
  // there's an order in progress and how far along it is - a single query
  // instead of one per table.
  findActiveForBranch(branchId: string): Promise<Order[]> {
    return this.orders.find({
      where: { branchId, status: In(ACTIVE_ORDER_STATUSES) },
      relations: ['items', 'items.modifiers', 'items.kitchenStation', 'table'],
      order: { createdAt: 'ASC' },
    });
  }

  // What a Kitchen Display fetches once on load (or reconnect after a
  // reboot) to repopulate its ticket rail before the WebSocket starts
  // delivering new events - without this, a KDS that restarts mid-shift
  // would show a blank screen until the next item is created.
  async findActiveItemsForStation(branchId: string, stationId: string): Promise<OrderItem[]> {
    return this.orderItems.find({
      where: {
        kitchenStationId: stationId,
        status: In([OrderItemStatus.QUEUED, OrderItemStatus.COOKING]),
        order: { branchId },
      },
      relations: ['order', 'order.table', 'modifiers'],
      order: { createdAt: 'ASC' },
    });
  }

  private async getOrderOrThrow(id: string): Promise<Order> {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  // Called by the cashier when a dine-in check is closed, or once an
  // online/mobile payment is captured. Actual payment capture/recording
  // lives in PaymentsService - this just finalizes the order itself.
  async closeOrder(id: string, cashierStaffId: string | null): Promise<Order> {
    const order = await this.getOrderOrThrow(id);
    order.status = OrderStatus.CLOSED;
    order.cashierStaffId = cashierStaffId;
    order.closedAt = new Date();
    await this.orders.save(order);

    // The table isn't immediately FREE for new guests - it needs bussing
    // first. A waiter clears it to FREE from the floor view once that's done.
    if (order.tableId) {
      await this.tables.update(order.tableId, { status: TableStatus.NEEDS_CLEANING });
    }

    return this.findOne(id);
  }

  // The waiter's own action once they've physically brought the food to
  // the table - distinct from the kitchen-driven READY status, and the
  // signal the floor view uses to show "awaiting payment."
  async markServed(id: string): Promise<Order> {
    const order = await this.getOrderOrThrow(id);
    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException(`Order must be ready before it can be marked served (currently ${order.status})`);
    }
    order.status = OrderStatus.SERVED;
    await this.orders.save(order);
    return this.findOne(id);
  }
}
