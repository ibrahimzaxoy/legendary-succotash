import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Supplier } from './supplier.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { PaymentMethod } from '../../../common/enums/payment.enum';

// A cash settlement against a supplier's balance - either against one
// specific PO or a general account payment (net-30 vendors are typically
// billed/paid in aggregate, not PO-by-PO). This is what posts the
// SUPPLIER_PAYMENT ledger entry - the PO itself never does (cash-basis ledger).
@Entity('supplier_payments')
export class SupplierPayment {
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
  supplierId: string;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Column({ type: 'varchar', nullable: true })
  purchaseOrderId: string | null;

  @ManyToOne(() => PurchaseOrder, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'varchar', nullable: true })
  paidByStaffId: string | null;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @CreateDateColumn()
  paidAt: Date;
}
