import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { PayrollRunStatus } from '../../../common/enums/hr.enum';

@Entity('payroll_runs')
export class PayrollRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'date' })
  periodStart: string;

  @Column({ type: 'date' })
  periodEnd: string;

  @Column({ type: 'enum', enum: PayrollRunStatus, default: PayrollRunStatus.DRAFT })
  status: PayrollRunStatus;

  @Column({ type: 'varchar', nullable: true })
  generatedByStaffId: string | null;

  @CreateDateColumn()
  generatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date | null;
}
