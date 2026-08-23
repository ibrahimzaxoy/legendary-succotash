import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TableSession } from './table-session.entity';

// deviceToken is an anonymous identifier generated client-side and stored
// in that phone's localStorage - re-opening the same table's QR link on the
// same phone rejoins as the same guest instead of creating a duplicate one.
@Entity('table_session_guests')
@Index(['tableSessionId', 'deviceToken'], { unique: true })
export class TableSessionGuest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  tableSessionId: string;

  @ManyToOne(() => TableSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tableSessionId' })
  tableSession: TableSession;

  @Column()
  deviceToken: string;

  @Column()
  guestLabel: string;

  @CreateDateColumn()
  joinedAt: Date;
}
