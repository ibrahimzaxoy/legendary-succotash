import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { InventoryUnit } from '../../../common/enums/inventory.enum';

// A raw ingredient, not a menu item - "Mozzarella" the cheese, not
// "Margherita Pizza" the dish. Menu items reference these via RecipeIngredient.
@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: InventoryUnit })
  unit: InventoryUnit;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  currentStock: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  reorderThreshold: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  reorderQuantity: string;

  // Weighted-average cost per unit, updated on every purchase receipt -
  // what recipe deductions are costed against for COGS.
  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  averageUnitCost: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
