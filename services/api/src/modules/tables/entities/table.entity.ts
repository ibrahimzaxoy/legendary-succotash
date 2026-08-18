import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { TableStatus } from '../../../common/enums/order.enum';

// Named RestaurantTable (not Table) to avoid clashing with the reserved
// SQL keyword and TypeORM's own vocabulary; the DB table is `restaurant_tables`.
@Entity('restaurant_tables')
@Index(['branchId', 'number'], { unique: true })
export class RestaurantTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  // Human-facing table number/name printed on the table tent, e.g. "12" or "Patio-3".
  @Column()
  number: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ default: 4 })
  capacity: number;

  @Column({ type: 'enum', enum: TableStatus, default: TableStatus.FREE })
  status: TableStatus;

  // Signed, unguessable token embedded in the table's QR code URL
  // (.../t/{tableId}?tk={qrToken}) so scanning one table's code can never
  // add items to another table's bill.
  @Index({ unique: true })
  @Column()
  qrToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
