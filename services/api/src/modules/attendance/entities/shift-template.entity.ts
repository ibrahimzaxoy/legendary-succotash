import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';

// A named recurring shift (e.g. "Morning", "Afternoon", "Night") a branch
// defines once and then rosters staff onto by date via ShiftAssignment -
// supports "3 daily shifts/rotations per branch" directly.
@Entity('shift_templates')
export class ShiftTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column()
  name: string;

  // 'HH:mm' - stored as SQL TIME, compared against a shift's date at roster/report time.
  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  // Which days of the week this template normally runs (0=Sunday..6=Saturday) -
  // informational for building a roster faster; ShiftAssignment is what actually schedules a date.
  @Column({ type: 'simple-json' })
  daysOfWeek: number[];

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
