import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { ShiftAssignment } from './shift-assignment.entity';
import { AttendanceStatus, ClockMethod } from '../../../common/enums/hr.enum';

// One clock-in..clock-out pair. Created on clock-in (open, clockOutAt null),
// closed on clock-out. Payroll (§payroll module) sums totalMinutesWorked
// per staff over a period rather than re-deriving hours from raw punches.
@Entity('attendance_records')
export class AttendanceRecord {
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
  staffId: string;

  @ManyToOne(() => Staff, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staffId' })
  staff: Staff;

  // Set when today's roster has a matching ShiftAssignment for this staff
  // member - null means this was an unscheduled clock-in.
  @Column({ type: 'varchar', nullable: true })
  shiftAssignmentId: string | null;

  @ManyToOne(() => ShiftAssignment, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'shiftAssignmentId' })
  shiftAssignment: ShiftAssignment | null;

  @Column({ type: 'datetime' })
  clockInAt: Date;

  @Column({ type: 'datetime', nullable: true })
  clockOutAt: Date | null;

  @Column({ type: 'enum', enum: ClockMethod, default: ClockMethod.PIN })
  clockInMethod: ClockMethod;

  @Column({ type: 'enum', enum: ClockMethod, nullable: true })
  clockOutMethod: ClockMethod | null;

  // Computed and frozen at clock-out - never recomputed later even if
  // records are inspected again, so payroll sums stay stable.
  @Column({ type: 'int', nullable: true })
  totalMinutesWorked: number | null;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
