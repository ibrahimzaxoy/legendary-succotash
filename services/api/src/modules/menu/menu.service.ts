import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { MenuItemVariant } from './entities/menu-item-variant.entity';
import { ModifierGroup } from './entities/modifier-group.entity';
import { ModifierOption } from './entities/modifier-option.entity';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

// MySQL's FK violation error code when a delete is blocked by a
// RESTRICT constraint (here: OrderItem.menuItemId referencing a menu item
// that's already been ordered - history must stay intact).
function isForeignKeyRestriction(err: unknown): boolean {
  const code = (err as { code?: string; errno?: number } | undefined)?.code;
  const errno = (err as { code?: string; errno?: number } | undefined)?.errno;
  return code === 'ER_ROW_IS_REFERENCED_2' || errno === 1451;
}

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly categories: Repository<MenuCategory>,
    @InjectRepository(MenuItem)
    private readonly items: Repository<MenuItem>,
    @InjectRepository(MenuItemVariant)
    private readonly variants: Repository<MenuItemVariant>,
    @InjectRepository(ModifierGroup)
    private readonly modifierGroups: Repository<ModifierGroup>,
    @InjectRepository(ModifierOption)
    private readonly modifierOptions: Repository<ModifierOption>,
  ) {}

  createCategory(dto: CreateMenuCategoryDto): Promise<MenuCategory> {
    return this.categories.save(this.categories.create(dto));
  }

  findCategoriesForBranch(branchId: string): Promise<MenuCategory[]> {
    return this.categories.find({ where: { branchId }, order: { sortOrder: 'ASC' } });
  }

  async updateCategory(id: string, dto: UpdateMenuCategoryDto): Promise<MenuCategory> {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Menu category ${id} not found`);
    Object.assign(category, dto);
    return this.categories.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      const result = await this.categories.delete(id);
      if (result.affected === 0) throw new NotFoundException(`Menu category ${id} not found`);
    } catch (err) {
      if (isForeignKeyRestriction(err)) {
        throw new BadRequestException(
          'Some items in this category have order history and can’t be deleted - mark them unavailable instead of deleting the category.',
        );
      }
      throw err;
    }
  }

  async createItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    const item = this.items.create({
      branchId: dto.branchId,
      categoryId: dto.categoryId,
      kitchenStationId: dto.kitchenStationId,
      name: dto.name,
      description: dto.description ?? null,
      basePrice: dto.basePrice,
      imageUrl: dto.imageUrl ?? null,
      availableDineIn: dto.availableDineIn ?? true,
      availablePickup: dto.availablePickup ?? true,
      availableDelivery: dto.availableDelivery ?? true,
      prepTimeMinutes: dto.prepTimeMinutes ?? 0,
    });
    const saved = await this.items.save(item);

    if (dto.variants?.length) {
      const variantEntities = dto.variants.map((v) =>
        this.variants.create({ ...v, menuItemId: saved.id }),
      );
      await this.variants.save(variantEntities);
    }

    if (dto.modifierGroups?.length) {
      for (const group of dto.modifierGroups) {
        const groupEntity = await this.modifierGroups.save(
          this.modifierGroups.create({
            name: group.name,
            isRequired: group.isRequired ?? false,
            minSelect: group.minSelect ?? 1,
            maxSelect: group.maxSelect ?? 1,
            menuItemId: saved.id,
          }),
        );
        if (group.options?.length) {
          const optionEntities = group.options.map((o) =>
            this.modifierOptions.create({ ...o, modifierGroupId: groupEntity.id }),
          );
          await this.modifierOptions.save(optionEntities);
        }
      }
    }

    return this.findItem(saved.id);
  }

  findItemsForBranch(branchId: string, channel?: 'dineIn' | 'pickup' | 'delivery'): Promise<MenuItem[]> {
    const where: Record<string, unknown> = { branchId, isAvailable: true };
    if (channel === 'dineIn') where.availableDineIn = true;
    if (channel === 'pickup') where.availablePickup = true;
    if (channel === 'delivery') where.availableDelivery = true;
    return this.items.find({
      where,
      relations: ['variants', 'modifierGroups', 'modifierGroups.options', 'kitchenStation'],
      order: { name: 'ASC' },
    });
  }

  // Unlike findItemsForBranch (which every ordering channel uses and which
  // deliberately hides 86'd items), the Management Dashboard needs to see
  // -and re-enable- unavailable items too.
  findAllItemsForBranchAdmin(branchId: string): Promise<MenuItem[]> {
    return this.items.find({
      where: { branchId },
      relations: ['variants', 'modifierGroups', 'modifierGroups.options', 'kitchenStation'],
      order: { name: 'ASC' },
    });
  }

  async findItem(id: string): Promise<MenuItem> {
    const item = await this.items.findOne({
      where: { id },
      relations: ['variants', 'modifierGroups', 'modifierGroups.options', 'kitchenStation'],
    });
    if (!item) {
      throw new NotFoundException(`Menu item ${id} not found`);
    }
    return item;
  }

  async setAvailability(id: string, isAvailable: boolean): Promise<MenuItem> {
    const item = await this.findItem(id);
    item.isAvailable = isAvailable;
    return this.items.save(item);
  }

  // Base fields only - variants/modifier groups are creation-time only for
  // now (no endpoint edits their nested collections after the fact).
  async updateItem(id: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    const item = await this.findItem(id);
    Object.assign(item, dto);
    await this.items.save(item);
    return this.findItem(id);
  }

  async deleteItem(id: string): Promise<void> {
    try {
      const result = await this.items.delete(id);
      if (result.affected === 0) throw new NotFoundException(`Menu item ${id} not found`);
    } catch (err) {
      if (isForeignKeyRestriction(err)) {
        throw new BadRequestException('This item has order history and can’t be deleted - mark it unavailable instead.');
      }
      throw err;
    }
  }
}
