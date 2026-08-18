import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { DeliveryStatus } from '../../../common/enums/payment.enum';

// Fulfilled exclusively by the restaurant's own drivers (Staff with role =
// rider, scoped to a branch) - there is deliberately no third-party
// marketplace field here.
@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  // Assigned by a branch dispatcher/manager; null until dispatched.
  @Column({ type: 'varchar', nullable: true })
  driverStaffId: string | null;

  @ManyToOne(() => Staff, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'driverStaffId' })
  driver: Staff | null;

  @Column()
  address: string;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  lat: string | null;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  lng: string | null;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.ASSIGNED })
  status: DeliveryStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee: string;

  @CreateDateColumn()
  assignedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  pickedUpAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  deliveredAt: Date | null;
}
