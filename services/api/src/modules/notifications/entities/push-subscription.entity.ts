import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// Anchored to an order, not a customer account - guests don't have
// accounts (see the mobile app / table PWA's guest-only design), so an
// order is the natural thing to subscribe to for status push.
@Entity('push_subscriptions')
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  orderId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 500 })
  endpoint: string;

  @Column()
  p256dh: string;

  @Column()
  auth: string;

  @CreateDateColumn()
  createdAt: Date;
}
