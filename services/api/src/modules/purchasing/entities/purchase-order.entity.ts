import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Supplier } from './supplier.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { PurchaseOrderStatus } from '../../../common/enums/purchasing.enum';

@Entity('purchase_orders')
export class PurchaseOrder {
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

  @Column({ type: 'enum', enum: PurchaseOrderStatus, default: PurchaseOrderStatus.DRAFT })
  status: PurchaseOrderStatus;

  @Column({ type: 'datetime', nullable: true })
  orderedAt: Date | null;

  @Column({ type: 'date', nullable: true })
  expectedAt: string | null;

  @Column({ type: 'varchar', nullable: true })
  createdByStaffId: string | null;

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, { cascade: true })
  items: PurchaseOrderItem[];

  @CreateDateColumn()
  createdAt: Date;
}
