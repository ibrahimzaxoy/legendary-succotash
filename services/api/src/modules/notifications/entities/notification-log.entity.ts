import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum NotificationStatus {
  SENT = 'sent',
  FAILED = 'failed',
}

// Append-only send record, for debugging/audit only - a failed push is
// never retried (the same status is always also live over the existing
// WebSocket connection while the app is open; push only covers the
// screen-off/backgrounded gap, so a missed push never loses information
// the customer needed).
@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  subscriptionId: string | null;

  @Index()
  @Column()
  orderId: string;

  @Column()
  event: string;

  @Column({ type: 'enum', enum: NotificationStatus })
  status: NotificationStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
