import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseOrderReceiptLine } from './purchase-order-receipt-line.entity';

// One delivery event against a PO - receiving can happen in several
// partial batches, so each is its own append-only record rather than
// overwriting a single "received" flag.
@Entity('purchase_order_receipts')
export class PurchaseOrderReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @Column({ type: 'varchar', nullable: true })
  receivedByStaffId: string | null;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @OneToMany(() => PurchaseOrderReceiptLine, (line) => line.receipt, { cascade: true })
  lines: PurchaseOrderReceiptLine[];

  @CreateDateColumn()
  receivedAt: Date;
}
