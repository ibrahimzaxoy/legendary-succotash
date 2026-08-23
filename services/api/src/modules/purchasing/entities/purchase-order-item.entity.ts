import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';

// No inventoryItemId FK yet - the Inventory module (recipe/COGS tracking)
// is a later phase; itemName is a free-text description for now and will
// gain an optional inventoryItemId link when that phase lands, without
// needing to touch existing rows (they'll simply have no link).
@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @Column()
  itemName: string;

  @Column({ type: 'varchar', nullable: true })
  unit: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantityOrdered: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantityReceived: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  lineTotal: string;
}
