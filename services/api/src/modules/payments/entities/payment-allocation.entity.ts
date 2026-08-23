import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Payment } from './payment.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

// Split checkout, "pay for your own items" mode: records which Payment
// covered which OrderItem(s), grouped by OrderItem.orderedByGuestId when the
// split was created (see PaymentsService.captureSplitByGuest). "Split evenly"
// needs none of this - it just creates several plain Payment rows.
@Entity('payment_allocations')
export class PaymentAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  paymentId: string;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Index()
  @Column()
  orderItemId: string;

  @ManyToOne(() => OrderItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItem;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  allocatedAmount: string;
}
