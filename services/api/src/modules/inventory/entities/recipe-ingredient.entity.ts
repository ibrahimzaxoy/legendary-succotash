import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MenuItem } from '../../menu/entities/menu-item.entity';
import { MenuItemVariant } from '../../menu/entities/menu-item-variant.entity';
import { InventoryItem } from './inventory-item.entity';

// Links a menu item (or one specific variant, e.g. "Large" using more
// cheese than the base recipe) to a raw ingredient it consumes. Opt-in -
// a menu item with no rows here simply never deducts stock.
@Entity('recipe_ingredients')
export class RecipeIngredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  menuItemId: string;

  @ManyToOne(() => MenuItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  @Column({ type: 'varchar', nullable: true })
  menuItemVariantId: string | null;

  @ManyToOne(() => MenuItemVariant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'menuItemVariantId' })
  menuItemVariant: MenuItemVariant | null;

  @Index()
  @Column()
  inventoryItemId: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inventoryItemId' })
  inventoryItem: InventoryItem;

  // In the InventoryItem's own unit.
  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantityRequired: string;
}
