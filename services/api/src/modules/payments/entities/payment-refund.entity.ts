import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Payment } from './payment.entity';
import { Staff } from '../../staff/entities/staff.entity';

// Append-only, same philosophy as every other financial history table in
// this system: a refund is never edited or deleted, and Payment.status
// only ever flips to REFUNDED once the sum of these rows covers the full
// captured amount - partial refunds leave the payment CAPTURED with a
// partial history, derivable by summing this table (never stored as a
// single mutable "amountRefunded" field on Payment itself).
@Entity('payment_refunds')
export class PaymentRefund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  paymentId: string;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  // The cashier/manager who issued the refund - nullable since a refund
  // could in principle be triggered by an automated flow later (a payment
  // gateway webhook, say), not just an in-person staff action.
  @Column({ type: 'varchar', nullable: true })
  staffId: string | null;

  @ManyToOne(() => Staff, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'staffId' })
  staff: Staff | null;

  @CreateDateColumn()
  createdAt: Date;
}
