import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, Repository } from 'typeorm';
import { TableSession } from './entities/table-session.entity';
import { TableSessionGuest } from './entities/table-session-guest.entity';
import { SharedCartItem } from './entities/shared-cart-item.entity';
import { RestaurantTable } from './entities/table.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { Order } from '../orders/entities/order.entity';
import { JoinTableSessionDto } from './dto/join-table-session.dto';
import { AddSharedCartItemDto } from './dto/add-shared-cart-item.dto';
import { OrderChannel, TableSessionStatus } from '../../common/enums/order.enum';
import { OrdersService } from '../orders/orders.service';
import { OrderItemInputDto } from '../orders/dto/create-order.dto';
import {
  SHARED_CART_ITEM_ADDED,
  SHARED_CART_ITEM_REMOVED,
  SHARED_CART_SUBMITTED,
  TABLE_SESSION_GUEST_JOINED,
} from './table-sessions.events';

export interface TableSessionState {
  session: TableSession;
  guest: TableSessionGuest;
  guests: TableSessionGuest[];
  cartItems: SharedCartItem[];
}

@Injectable()
export class TableSessionsService {
  constructor(
    @InjectRepository(TableSession)
    private readonly sessions: Repository<TableSession>,
    @InjectRepository(TableSessionGuest)
    private readonly guests: Repository<TableSessionGuest>,
    @InjectRepository(SharedCartItem)
    private readonly cartItems: Repository<SharedCartItem>,
    @InjectRepository(MenuItem)
    private readonly menuItems: Repository<MenuItem>,
    @InjectRepository(RestaurantTable)
    private readonly tables: Repository<RestaurantTable>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly ordersService: OrdersService,
    private readonly events: EventEmitter2,
  ) {}

  // Finds (or starts) the table's one active session, then finds (or
  // creates) this device's guest row within it. Re-scanning the same
  // table's QR on the same phone rejoins as the same guest rather than
  // creating a duplicate (see TableSessionGuest.deviceToken).
  //
  // The whole find-or-create runs inside one transaction that takes a
  // pessimistic write lock on the table row first: two guests scanning the
  // QR within milliseconds of each other (the common case - the first two
  // people to sit down) would otherwise both see "no active session yet"
  // and each create their own, silently splitting the table into two carts
  // that can never see each other. Locking the table row serializes
  // concurrent joins for that table so the second one always sees the
  // first one's session.
  async join(dto: JoinTableSessionDto): Promise<TableSessionState> {
    const { session, guest, isNewGuest } = await this.dataSource.transaction(async (manager) => {
      const table = await manager.findOne(RestaurantTable, {
        where: { id: dto.tableId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!table) throw new NotFoundException(`Table ${dto.tableId} not found`);

      let session = await manager.findOne(TableSession, {
        where: { tableId: dto.tableId, status: TableSessionStatus.ACTIVE },
      });
      if (!session) {
        session = await manager.save(TableSession, manager.create(TableSession, { branchId: table.branchId, tableId: dto.tableId }));
      }

      let guest = await manager.findOne(TableSessionGuest, { where: { tableSessionId: session.id, deviceToken: dto.deviceToken } });
      let isNewGuest = false;
      if (!guest) {
        const guestCount = await manager.count(TableSessionGuest, { where: { tableSessionId: session.id } });
        guest = await manager.save(
          TableSessionGuest,
          manager.create(TableSessionGuest, { tableSessionId: session.id, deviceToken: dto.deviceToken, guestLabel: `Guest ${guestCount + 1}` }),
        );
        isNewGuest = true;
      }

      return { session, guest, isNewGuest };
    });

    if (isNewGuest) {
      this.events.emit(TABLE_SESSION_GUEST_JOINED, {
        tableId: dto.tableId,
        guest: { id: guest.id, guestLabel: guest.guestLabel },
      });
    }

    return this.loadState(session, guest);
  }

  async getState(sessionId: string, guestId: string): Promise<TableSessionState> {
    const session = await this.getSessionOrThrow(sessionId);
    const guest = await this.getGuestOrThrow(sessionId, guestId);
    return this.loadState(session, guest);
  }

  private async loadState(session: TableSession, guest: TableSessionGuest): Promise<TableSessionState> {
    const [guests, cartItems] = await Promise.all([
      this.guests.find({ where: { tableSessionId: session.id }, order: { joinedAt: 'ASC' } }),
      this.cartItems.find({ where: { tableSessionId: session.id }, order: { addedAt: 'ASC' } }),
    ]);
    return { session, guest, guests, cartItems };
  }

  async addCartItem(sessionId: string, dto: AddSharedCartItemDto): Promise<SharedCartItem> {
    const session = await this.getSessionOrThrow(sessionId);
    await this.getGuestOrThrow(sessionId, dto.guestId);

    const menuItem = await this.menuItems.findOne({
      where: { id: dto.menuItemId },
      relations: ['variants', 'modifierGroups', 'modifierGroups.options'],
    });
    if (!menuItem || !menuItem.isAvailable) {
      throw new BadRequestException(`Menu item ${dto.menuItemId} is not available`);
    }

    let unitPrice = Number(menuItem.basePrice);
    let nameSnapshot = menuItem.name;
    let variant = null as (typeof menuItem.variants)[number] | null;
    if (dto.menuItemVariantId) {
      variant = menuItem.variants.find((v) => v.id === dto.menuItemVariantId) ?? null;
      if (!variant) throw new BadRequestException(`Variant ${dto.menuItemVariantId} does not belong to menu item`);
      unitPrice += Number(variant.priceDelta);
      nameSnapshot = `${menuItem.name} (${variant.name})`;
    }

    const modifierNames: string[] = [];
    if (dto.modifierOptionIds?.length) {
      const allOptions = menuItem.modifierGroups.flatMap((g) => g.options);
      for (const optionId of dto.modifierOptionIds) {
        const option = allOptions.find((o) => o.id === optionId);
        if (!option) throw new BadRequestException(`Modifier option ${optionId} does not belong to menu item`);
        modifierNames.push(option.name);
        unitPrice += Number(option.priceDelta);
      }
    }

    const saved = await this.cartItems.save(
      this.cartItems.create({
        tableSessionId: session.id,
        guestId: dto.guestId,
        menuItemId: menuItem.id,
        menuItemVariantId: variant?.id ?? null,
        modifierOptionIds: dto.modifierOptionIds ?? null,
        nameSnapshot,
        unitPriceSnapshot: unitPrice.toFixed(2),
        modifierNamesSnapshot: modifierNames,
        quantity: dto.quantity,
        notes: dto.notes ?? null,
      }),
    );

    this.events.emit(SHARED_CART_ITEM_ADDED, {
      tableId: session.tableId,
      item: {
        id: saved.id,
        guestId: saved.guestId,
        menuItemId: saved.menuItemId,
        menuItemVariantId: saved.menuItemVariantId,
        modifierOptionIds: saved.modifierOptionIds,
        nameSnapshot: saved.nameSnapshot,
        unitPriceSnapshot: saved.unitPriceSnapshot,
        modifierNamesSnapshot: saved.modifierNamesSnapshot,
        quantity: saved.quantity,
        notes: saved.notes,
      },
    });

    return saved;
  }

  // A guest can remove their own items only - the sane social-norm default
  // (see IMPLEMENTATION_PLAN.md §18, revisitable per §22 open question 7).
  async removeCartItem(sessionId: string, itemId: string, guestId: string): Promise<void> {
    const item = await this.cartItems.findOne({ where: { id: itemId, tableSessionId: sessionId } });
    if (!item) throw new NotFoundException(`Cart item ${itemId} not found`);
    if (item.guestId !== guestId) {
      throw new ForbiddenException('You can only remove items you added yourself');
    }
    const session = await this.getSessionOrThrow(sessionId);
    await this.cartItems.delete(itemId);
    this.events.emit(SHARED_CART_ITEM_REMOVED, { tableId: session.tableId, itemId });
  }

  // Converts every current SharedCartItem into a real OrderItem via the
  // existing OrdersService flow (creating the order if this is the table's
  // first submission, appending otherwise) - carrying guestId forward as
  // OrderItem.orderedByGuestId so split checkout can group by it later.
  async submit(sessionId: string): Promise<Order> {
    const session = await this.getSessionOrThrow(sessionId);
    const [items, guests] = await Promise.all([
      this.cartItems.find({ where: { tableSessionId: session.id } }),
      this.guests.find({ where: { tableSessionId: session.id } }),
    ]);
    if (items.length === 0) {
      throw new BadRequestException('The shared cart is empty');
    }
    const guestLabelById = new Map(guests.map((g) => [g.id, g.guestLabel]));

    const orderItems: OrderItemInputDto[] = items.map((item) => ({
      menuItemId: item.menuItemId,
      menuItemVariantId: item.menuItemVariantId ?? undefined,
      modifierOptionIds: item.modifierOptionIds ?? undefined,
      quantity: item.quantity,
      notes: item.notes ?? undefined,
      orderedByGuestId: item.guestId,
      orderedByGuestLabel: guestLabelById.get(item.guestId),
    }));

    const existing = await this.ordersService.findActiveForTable(session.branchId, session.tableId);
    const order = existing
      ? await this.ordersService.addItems(existing.id, { items: orderItems })
      : await this.ordersService.createOrder({
          branchId: session.branchId,
          tableId: session.tableId,
          channel: OrderChannel.DINE_IN_QR,
          items: orderItems,
        });

    await this.cartItems.delete({ tableSessionId: session.id });
    this.events.emit(SHARED_CART_SUBMITTED, { tableId: session.tableId, orderId: order.id });
    return order;
  }

  // Hooked from TablesService.setStatus whenever a table leaves OCCUPIED
  // (bussed to NEEDS_CLEANING/FREE/RESERVED) - without this, a table's
  // session would stay "active" forever and the next party seated there
  // would incorrectly rejoin the previous guests' session.
  async closeActiveForTable(tableId: string): Promise<void> {
    await this.sessions.update({ tableId, status: TableSessionStatus.ACTIVE }, { status: TableSessionStatus.CLOSED, closedAt: new Date() });
  }

  private async getSessionOrThrow(id: string): Promise<TableSession> {
    const session = await this.sessions.findOne({ where: { id } });
    if (!session) throw new NotFoundException(`Table session ${id} not found`);
    return session;
  }

  private async getGuestOrThrow(sessionId: string, guestId: string): Promise<TableSessionGuest> {
    const guest = await this.guests.findOne({ where: { id: guestId, tableSessionId: sessionId } });
    if (!guest) throw new NotFoundException(`Guest ${guestId} not found in this session`);
    return guest;
  }
}
