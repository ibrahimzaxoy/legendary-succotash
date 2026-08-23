import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { RestaurantTable } from './table.entity';
import { TableSessionStatus } from '../../../common/enums/order.enum';

// One continuous dining occupancy at a table - exists from the first QR
// scan (before any item is even added), which is what makes a genuinely
// pre-order live shared cart possible (Order today only exists once the
// first item is submitted). See IMPLEMENTATION_PLAN.md §18.
@Entity('table_sessions')
export class TableSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Index()
  @Column()
  tableId: string;

  @ManyToOne(() => RestaurantTable, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tableId' })
  table: RestaurantTable;

  @Column({ type: 'enum', enum: TableSessionStatus, default: TableSessionStatus.ACTIVE })
  status: TableSessionStatus;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  closedAt: Date | null;
}
