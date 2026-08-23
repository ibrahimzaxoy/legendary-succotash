import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PayrollRun } from './payroll-run.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { PayrollAdjustment } from './payroll-adjustment.entity';

// One payslip line: this staff member's pay for this run.
@Entity('payroll_lines')
export class PayrollLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  payrollRunId: string;

  @ManyToOne(() => PayrollRun, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payrollRunId' })
  payrollRun: PayrollRun;

  @Index()
  @Column()
  staffId: string;

  @ManyToOne(() => Staff, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'staffId' })
  staff: Staff;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  hoursWorked: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  overtimeHours: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePayAmount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  overtimeAmount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  bonusAmount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deductionAmount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  advanceDeductionAmount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  netPay: string;

  @OneToMany(() => PayrollAdjustment, (adjustment) => adjustment.payrollLine, { cascade: true })
  adjustments: PayrollAdjustment[];
}
