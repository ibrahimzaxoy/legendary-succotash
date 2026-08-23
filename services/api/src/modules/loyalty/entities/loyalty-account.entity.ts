import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

// Loyalty piggybacks on phone number as the identity - there is no
// first-class Customer account anywhere in this system, dine-in/mobile
// orders only ever carry customerName/customerPhone strings (see
// IMPLEMENTATION_PLAN.md §22). Restaurant-wide, not branch-scoped, so a
// guest's points follow them between branches - same reasoning as the
// supplier roster's scoping (§13).
@Entity('loyalty_accounts')
@Index(['restaurantId', 'phone'], { unique: true })
export class LoyaltyAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  restaurantId: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column()
  phone: string;

  // Last name seen on an order for this phone, kept fresh - purely
  // display convenience, phone is the real identity.
  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  // Denormalized for a fast read on every checkout - always re-derivable
  // by summing LoyaltyLedgerEntry.points, kept in sync transactionally by
  // LoyaltyService rather than trusted as the sole source of truth.
  @Column({ default: 0 })
  pointsBalance: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
