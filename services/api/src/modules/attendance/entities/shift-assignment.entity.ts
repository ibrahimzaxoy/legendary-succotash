import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { ShiftTemplate } from './shift-template.entity';
import { ShiftAssignmentStatus } from '../../../common/enums/hr.enum';

// One roster entry: this staff member works this shift template on this date.
@Entity('shift_assignments')
@Index(['staffId', 'date', 'shiftTemplateId'], { unique: true })
export class ShiftAssignment {
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

  @Column()
  shiftTemplateId: string;

  @ManyToOne(() => ShiftTemplate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shiftTemplateId' })
  shiftTemplate: ShiftTemplate;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: ShiftAssignmentStatus, default: ShiftAssignmentStatus.SCHEDULED })
  status: ShiftAssignmentStatus;

  @CreateDateColumn()
  createdAt: Date;
}
