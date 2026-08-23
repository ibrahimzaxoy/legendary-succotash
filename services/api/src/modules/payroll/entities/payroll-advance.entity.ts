import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { PayrollAdvanceStatus } from '../../../common/enums/hr.enum';

// A loan/advance issued to a staff member outside a payroll run, then
// deducted from future PayrollLines until remainingBalance reaches zero.
@Entity('payroll_advances')
export class PayrollAdvance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  staffId: string;

  @ManyToOne(() => Staff, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staffId' })
  staff: Staff;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', nullable: true })
  issuedByStaffId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  remainingBalance: string;

  @Column({ type: 'enum', enum: PayrollAdvanceStatus, default: PayrollAdvanceStatus.ACTIVE })
  status: PayrollAdvanceStatus;

  @CreateDateColumn()
  issuedAt: Date;
}
