import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PayrollLine } from './payroll-line.entity';
import { PayrollAdjustmentType } from '../../../common/enums/hr.enum';

// An itemized bonus/deduction on a payslip line, so "why is this person's
// pay different from the formula" is always answerable, never an opaque override.
@Entity('payroll_adjustments')
export class PayrollAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  payrollLineId: string;

  @ManyToOne(() => PayrollLine, (line) => line.adjustments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payrollLineId' })
  payrollLine: PayrollLine;

  @Column({ type: 'enum', enum: PayrollAdjustmentType })
  type: PayrollAdjustmentType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @Column({ type: 'varchar', nullable: true })
  addedByStaffId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
