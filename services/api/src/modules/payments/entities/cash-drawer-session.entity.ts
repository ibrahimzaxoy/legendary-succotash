import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { CashDrawerSessionStatus } from '../../../common/enums/payment.enum';

// "Open Shift"/"Close Shift" for a cashier's physical cash drawer. Opened
// with a counted starting float; closed with a counted ending amount,
// which the system compares against what cash payments during the
// session say *should* be there, logging any variance to the ledger.
@Entity('cash_drawer_sessions')
export class CashDrawerSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Index()
  @Column()
  cashierStaffId: string;

  @ManyToOne(() => Staff, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cashierStaffId' })
  cashier: Staff;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  openingFloat: string;

  @CreateDateColumn()
  openedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  expectedClosingCash: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  countedClosingCash: string | null;

  // Signed: positive = overage, negative = shortage.
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  variance: string | null;

  @Column({ type: 'varchar', nullable: true })
  varianceNote: string | null;

  @Column({ type: 'enum', enum: CashDrawerSessionStatus, default: CashDrawerSessionStatus.OPEN })
  status: CashDrawerSessionStatus;
}
