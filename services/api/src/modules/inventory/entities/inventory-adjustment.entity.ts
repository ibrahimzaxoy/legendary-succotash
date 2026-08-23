import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { InventoryItem } from './inventory-item.entity';
import { InventoryAdjustmentReason } from '../../../common/enums/inventory.enum';

// Append-only stock ledger, mirroring the accounting ledger's own
// philosophy - InventoryItem.currentStock is never mutated directly
// anywhere else in the codebase, only through a logged adjustment here.
@Entity('inventory_adjustments')
export class InventoryAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Index()
  @Column()
  inventoryItemId: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inventoryItemId' })
  inventoryItem: InventoryItem;

  // Signed - negative for a deduction, positive for a receipt/correction.
  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantityDelta: string;

  @Column({ type: 'enum', enum: InventoryAdjustmentReason })
  reason: InventoryAdjustmentReason;

  @Column({ type: 'varchar', nullable: true })
  referenceType: string | null;

  @Column({ type: 'varchar', nullable: true })
  referenceId: string | null;

  @Column({ type: 'varchar', nullable: true })
  staffId: string | null;

  // Captured at deduction time so COGS stays accurate even if
  // averageUnitCost changes later - the same snapshot-pricing principle
  // OrderItem.priceSnapshot already uses.
  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  unitCostSnapshot: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalCostSnapshot: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
