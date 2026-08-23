import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { ExpenseCategory } from './expense-category.entity';
import { Staff } from '../../staff/entities/staff.entity';

// Logged immediately by whoever spent the money (cashier or manager) - no
// approval gate in v1, loggedByStaffId is the audit trail, exactly how
// Payment.cashierStaffId already works.
@Entity('expenses')
export class Expense {
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
  categoryId: string;

  @ManyToOne(() => ExpenseCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: ExpenseCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: string;

  @Column()
  description: string;

  @Column({ type: 'varchar', nullable: true })
  receiptNote: string | null;

  @Column({ type: 'varchar', nullable: true })
  receiptImageUrl: string | null;

  @Column()
  loggedByStaffId: string;

  @ManyToOne(() => Staff, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'loggedByStaffId' })
  loggedBy: Staff;

  @Column({ type: 'date' })
  spentAt: string;

  @CreateDateColumn()
  createdAt: Date;
}
