import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { PaymentMethod, PaymentStatus } from '../../../common/enums/payment.enum';

// A dine-in check is only ever closed by a Cashier-role staff member
// (cashierStaffId) - waiters build orders but do not take payment
// themselves. Online mobile-app payments instead go through the payment
// gateway and cashierStaffId stays null.
@Entity('payments')
// closeCashDrawer() filters cashierStaffId + method + a createdAt range -
// see LedgerEntry/Order's identical composite-index additions.
@Index(['branchId', 'createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'varchar', nullable: true })
  cashierStaffId: string | null;

  @ManyToOne(() => Staff, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cashierStaffId' })
  cashier: Staff | null;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tipAmount: string;

  // Payment gateway transaction id (e.g. Stripe PaymentIntent id) for online payments.
  @Column({ type: 'varchar', nullable: true })
  externalReference: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
