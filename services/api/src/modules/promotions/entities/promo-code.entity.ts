import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { PromoDiscountType } from '../../../common/enums/promotion.enum';

// Restaurant-wide, not branch-scoped - same reasoning as suppliers (§13)
// and loyalty accounts (§22): a promo campaign is run by the business, not
// one branch.
@Entity('promo_codes')
@Index(['restaurantId', 'code'], { unique: true })
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  restaurantId: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  // Stored upper-cased so lookups are case-insensitive without a DB collation dance.
  @Column()
  code: string;

  @Column({ type: 'enum', enum: PromoDiscountType })
  discountType: PromoDiscountType;

  // Percentage as a whole number (e.g. 15 = 15%) or a fixed dollar amount,
  // depending on discountType.
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOrderAmount: string | null;

  @Column({ type: 'int', nullable: true })
  usageLimit: number | null;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
