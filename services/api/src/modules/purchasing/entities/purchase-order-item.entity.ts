import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

// itemName stays the source of truth for what was ordered (free text, no
// FK required) - inventoryItemId is an optional link that, when set,
// makes receiving this line also update that ingredient's stock/cost.
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

  @Column({ type: 'varchar', nullable: true })
  inventoryItemId: string | null;

  @ManyToOne(() => InventoryItem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'inventoryItemId' })
  inventoryItem: InventoryItem | null;
}
