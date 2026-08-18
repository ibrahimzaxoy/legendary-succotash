import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Role } from '../../../common/enums/role.enum';

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  restaurantId: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  // Null only for restaurant-wide roles (owner/admin) that aren't tied to
  // a single branch. Every other role (waiter, cashier, kitchen, rider,
  // manager) is scoped to one branch.
  @Index()
  @Column({ type: 'varchar', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch | null;

  @Column()
  fullName: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  // Web/back-office login (owner, manager, admin).
  @Column({ type: 'varchar', nullable: true, select: false })
  passwordHash: string | null;

  // Fast PIN login for shared floor tablets (waiter, cashier, kitchen, rider).
  @Column({ type: 'varchar', nullable: true, select: false })
  pinHash: string | null;

  @Column({ default: true })
  active: boolean;

  // Rider self-service toggle - "on shift and available for dispatch" vs
  // clocked off. Only meaningful for role = rider; other roles ignore it.
  @Column({ default: false })
  onShift: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
