import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

// Shared across every branch of a restaurant - "gas", "electricity",
// "cleaning supplies" mean the same thing everywhere, so the taxonomy
// isn't duplicated per branch.
@Entity('expense_categories')
export class ExpenseCategory {
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

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
