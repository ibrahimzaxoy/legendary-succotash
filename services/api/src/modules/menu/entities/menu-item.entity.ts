import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { MenuCategory } from './menu-category.entity';
import { KitchenStation } from '../../kitchen/entities/kitchen-station.entity';
import { MenuItemVariant } from './menu-item-variant.entity';
import { ModifierGroup } from './modifier-group.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Index()
  @Column()
  categoryId: string;

  @ManyToOne(() => MenuCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: MenuCategory;

  // Which kitchen station cooks this item - this single field is what makes
  // "pizza goes to the pizza station, hookah goes to the hookah station" work.
  @Index()
  @Column()
  kitchenStationId: string;

  @ManyToOne(() => KitchenStation, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'kitchenStationId' })
  kitchenStation: KitchenStation;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ default: true })
  isAvailable: boolean;

  // Per-channel visibility - e.g. hookah is dine-in only, a sauce SKU is delivery-only.
  @Column({ default: true })
  availableDineIn: boolean;

  @Column({ default: true })
  availablePickup: boolean;

  @Column({ default: true })
  availableDelivery: boolean;

  @Column({ default: 0 })
  prepTimeMinutes: number;

  @OneToMany(() => MenuItemVariant, (variant) => variant.menuItem)
  variants: MenuItemVariant[];

  @OneToMany(() => ModifierGroup, (group) => group.menuItem)
  modifierGroups: ModifierGroup[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
