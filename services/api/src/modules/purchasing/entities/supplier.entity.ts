import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

// Restaurant-wide, not branch-scoped - a produce vendor typically serves
// every branch of a chain under one account/terms. PurchaseOrders are
// still placed by a specific branch against this shared roster.
@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  restaurantId: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  contactName: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'int', default: 30 })
  paymentTermsDays: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
