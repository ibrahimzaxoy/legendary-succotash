import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Staff } from '../../staff/entities/staff.entity';
import { PayType } from '../../../common/enums/hr.enum';

// A rate change is a new row, never an edit to an old one - a payroll run
// always computes against whichever rate was actually in effect for each
// day of its period, so past runs never silently recompute.
@Entity('pay_rates')
export class PayRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  staffId: string;

  @ManyToOne(() => Staff, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staffId' })
  staff: Staff;

  @Column({ type: 'enum', enum: PayType })
  payType: PayType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseRate: string;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 1.5 })
  overtimeMultiplier: string;

  @Column({ type: 'date' })
  effectiveFrom: string;

  @CreateDateColumn()
  createdAt: Date;
}
