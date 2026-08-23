import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LoyaltyAccount } from './loyalty-account.entity';
import { LoyaltyEntryType } from '../../../common/enums/loyalty.enum';

// Append-only, mirrors the accounting ledger's philosophy: a correction is
// a new offsetting entry, never an edit to history.
@Entity('loyalty_ledger_entries')
export class LoyaltyLedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  accountId: string;

  @ManyToOne(() => LoyaltyAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: LoyaltyAccount;

  @Column({ type: 'enum', enum: LoyaltyEntryType })
  type: LoyaltyEntryType;

  // Positive for earned/upward adjustment, negative for redeemed/downward.
  @Column()
  points: number;

  @Column({ type: 'varchar', nullable: true })
  orderId: string | null;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
