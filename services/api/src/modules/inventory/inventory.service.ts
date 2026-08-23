import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Between, IsNull, Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { InventoryAdjustment } from './entities/inventory-adjustment.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SetRecipeIngredientDto } from './dto/set-recipe-ingredient.dto';
import { InventoryAdjustmentReason } from '../../common/enums/inventory.enum';
import { OrderItemStatus } from '../../common/enums/order.enum';
import { ORDER_ITEM_STATUS_UPDATED, OrderItemStatusUpdatedEvent } from '../kitchen/kitchen.events';
import { INVENTORY_LOW_STOCK } from './inventory.events';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly items: Repository<InventoryItem>,
    @InjectRepository(RecipeIngredient)
    private readonly recipeIngredients: Repository<RecipeIngredient>,
    @InjectRepository(InventoryAdjustment)
    private readonly adjustments: Repository<InventoryAdjustment>,
    private readonly ordersService: OrdersService,
    private readonly events: EventEmitter2,
  ) {}

  // --- Ingredients ---

  createItem(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    return this.items.save(this.items.create(dto));
  }

  findItemsForBranch(branchId: string): Promise<InventoryItem[]> {
    return this.items.find({ where: { branchId, active: true }, order: { name: 'ASC' } });
  }

  async findItem(id: string): Promise<InventoryItem> {
    const item = await this.items.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item ${id} not found`);
    return item;
  }

  async updateItem(id: string, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const item = await this.findItem(id);
    Object.assign(item, dto);
    return this.items.save(item);
  }

  findLowStockForBranch(branchId: string): Promise<InventoryItem[]> {
    return this.items
      .createQueryBuilder('i')
      .where('i.branchId = :branchId', { branchId })
      .andWhere('i.active = true')
      .andWhere('i.currentStock <= i.reorderThreshold')
      .orderBy('i.name', 'ASC')
      .getMany();
  }

  // Manual corrections/waste/stocktakes - never a direct edit to
  // currentStock, always through a logged, attributable adjustment.
  async adjustStock(id: string, dto: AdjustStockDto, staffId: string): Promise<InventoryAdjustment> {
    const item = await this.findItem(id);
    item.currentStock = (Number(item.currentStock) + Number(dto.quantityDelta)).toFixed(3);
    await this.items.save(item);

    const adjustment = await this.adjustments.save(
      this.adjustments.create({
        branchId: item.branchId,
        inventoryItemId: item.id,
        quantityDelta: dto.quantityDelta,
        reason: dto.reason,
        referenceType: 'manual',
        staffId,
      }),
    );

    await this.maybeFireLowStock(item);
    return adjustment;
  }

  // --- Recipes ---

  async setRecipeIngredient(dto: SetRecipeIngredientDto): Promise<RecipeIngredient> {
    const existing = await this.recipeIngredients.findOne({
      where: {
        menuItemId: dto.menuItemId,
        menuItemVariantId: dto.menuItemVariantId ?? IsNull(),
        inventoryItemId: dto.inventoryItemId,
      },
    });
    if (existing) {
      existing.quantityRequired = dto.quantityRequired;
      return this.recipeIngredients.save(existing);
    }
    return this.recipeIngredients.save(
      this.recipeIngredients.create({
        menuItemId: dto.menuItemId,
        menuItemVariantId: dto.menuItemVariantId ?? null,
        inventoryItemId: dto.inventoryItemId,
        quantityRequired: dto.quantityRequired,
      }),
    );
  }

  findRecipeForMenuItem(menuItemId: string): Promise<RecipeIngredient[]> {
    return this.recipeIngredients.find({ where: { menuItemId }, relations: ['inventoryItem'] });
  }

  async removeRecipeIngredient(id: string): Promise<void> {
    const result = await this.recipeIngredients.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Recipe ingredient ${id} not found`);
  }

  // --- Auto-deduction: reuses the existing ORDER_ITEM_STATUS_UPDATED event ---

  @OnEvent(ORDER_ITEM_STATUS_UPDATED)
  async handleItemStatusUpdated(event: OrderItemStatusUpdatedEvent): Promise<void> {
    if (event.status !== OrderItemStatus.COOKING) return;

    const orderItem = await this.ordersService.findOrderItem(event.orderItemId);
    if (!orderItem) return;

    const allRecipeRows = await this.recipeIngredients.find({ where: { menuItemId: orderItem.menuItemId } });
    if (allRecipeRows.length === 0) return; // opt-in - no recipe means no deduction

    // A variant-specific recipe fully overrides the base recipe for that
    // variant, it doesn't merge with it.
    const variantRows = orderItem.menuItemVariantId
      ? allRecipeRows.filter((r) => r.menuItemVariantId === orderItem.menuItemVariantId)
      : [];
    const rowsToApply = variantRows.length > 0 ? variantRows : allRecipeRows.filter((r) => r.menuItemVariantId === null);

    for (const recipeRow of rowsToApply) {
      const inventoryItem = await this.items.findOne({ where: { id: recipeRow.inventoryItemId } });
      if (!inventoryItem) continue;

      const deductQty = Number(recipeRow.quantityRequired) * orderItem.quantity;
      const unitCost = Number(inventoryItem.averageUnitCost);
      const totalCost = deductQty * unitCost;

      // Stock is allowed to go negative rather than blocking the kitchen -
      // an inventory count that's out of sync shouldn't stop food going
      // out; a negative balance is itself a visible signal something's off,
      // and it always trips the low-stock alert below.
      inventoryItem.currentStock = (Number(inventoryItem.currentStock) - deductQty).toFixed(3);
      await this.items.save(inventoryItem);

      await this.adjustments.save(
        this.adjustments.create({
          branchId: inventoryItem.branchId,
          inventoryItemId: inventoryItem.id,
          quantityDelta: (-deductQty).toFixed(3),
          reason: InventoryAdjustmentReason.ORDER_DEDUCTION,
          referenceType: 'order_item',
          referenceId: orderItem.id,
          unitCostSnapshot: unitCost.toFixed(4),
          totalCostSnapshot: totalCost.toFixed(2),
        }),
      );

      await this.maybeFireLowStock(inventoryItem);
    }
  }

  private async maybeFireLowStock(item: InventoryItem): Promise<void> {
    if (Number(item.currentStock) > Number(item.reorderThreshold)) return;
    this.events.emit(INVENTORY_LOW_STOCK, {
      branchId: item.branchId,
      inventoryItemId: item.id,
      name: item.name,
      currentStock: item.currentStock,
      reorderThreshold: item.reorderThreshold,
    });
  }

  // --- Purchasing hookup: called by PurchasingService on each receipt line ---

  async receivePurchaseLine(inventoryItemId: string, quantityReceived: string, unitCost: string, referenceId: string): Promise<void> {
    const item = await this.items.findOne({ where: { id: inventoryItemId } });
    if (!item) return; // the PO line wasn't linked to a real inventory item - nothing to update

    const oldStock = Number(item.currentStock);
    const oldCost = Number(item.averageUnitCost);
    const receivedQty = Number(quantityReceived);
    const receivedCost = Number(unitCost);

    const newStock = oldStock + receivedQty;
    // Weighted average - falls back to the receipt's own cost if there was
    // no (or negative) prior stock to weight against.
    item.averageUnitCost = (newStock > 0 ? (oldStock * oldCost + receivedQty * receivedCost) / newStock : receivedCost).toFixed(4);
    item.currentStock = newStock.toFixed(3);
    await this.items.save(item);

    await this.adjustments.save(
      this.adjustments.create({
        branchId: item.branchId,
        inventoryItemId: item.id,
        quantityDelta: receivedQty.toFixed(3),
        reason: InventoryAdjustmentReason.PURCHASE_RECEIPT,
        referenceType: 'purchase_order_receipt_line',
        referenceId,
        unitCostSnapshot: receivedCost.toFixed(4),
        totalCostSnapshot: (receivedQty * receivedCost).toFixed(2),
      }),
    );
  }

  // --- Reporting ---

  async cogsForPeriod(branchId: string, from: Date, to: Date): Promise<number> {
    const rows = await this.adjustments.find({
      where: { branchId, reason: InventoryAdjustmentReason.ORDER_DEDUCTION, createdAt: Between(from, to) },
    });
    return rows.reduce((sum, r) => sum + Number(r.totalCostSnapshot ?? 0), 0);
  }
}
