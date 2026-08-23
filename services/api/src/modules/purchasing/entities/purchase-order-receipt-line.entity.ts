import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PurchaseOrderReceipt } from './purchase-order-receipt.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

@Entity('purchase_order_receipt_lines')
export class PurchaseOrderReceiptLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  receiptId: string;

  @ManyToOne(() => PurchaseOrderReceipt, (receipt) => receipt.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiptId' })
  receipt: PurchaseOrderReceipt;

  @Column()
  purchaseOrderItemId: string;

  @ManyToOne(() => PurchaseOrderItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'purchaseOrderItemId' })
  purchaseOrderItem: PurchaseOrderItem;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantityReceived: string;
}
