import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { RestaurantTable } from '../../tables/entities/table.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { OrderChannel, OrderStatus } from '../../../common/enums/order.enum';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'enum', enum: OrderChannel })
  channel: OrderChannel;

  // Dine-in only; null for pickup/delivery orders.
  @Index()
  @Column({ type: 'varchar', nullable: true })
  tableId: string | null;

  @ManyToOne(() => RestaurantTable, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'tableId' })
  table: RestaurantTable | null;

  // Set when a waiter creates/adds to the order on the guest's behalf.
  @Column({ type: 'varchar', nullable: true })
  waiterStaffId: string | null;

  @ManyToOne(() => Staff, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'waiterStaffId' })
  waiter: Staff | null;

  // Set by the Cashier module when the check is actually closed/paid.
  @Column({ type: 'varchar', nullable: true })
  cashierStaffId: string | null;

  @ManyToOne(() => Staff, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cashierStaffId' })
  cashier: Staff | null;

  // Guest contact for pickup/delivery orders that aren't tied to a table.
  @Column({ type: 'varchar', nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', nullable: true })
  customerPhone: string | null;

  @Column({ type: 'varchar', nullable: true })
  deliveryAddress: string | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.OPEN })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  closedAt: Date | null;
}
