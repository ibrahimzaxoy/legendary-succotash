import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TableSession } from './table-session.entity';
import { TableSessionGuest } from './table-session-guest.entity';

// The pre-order cart - distinct from OrderItem, which doesn't exist until
// submission. Every phone at the table sees these live over the
// `table-session:{tableId}` WebSocket room (see OrdersGateway). Snapshots
// (nameSnapshot/unitPriceSnapshot/modifierNamesSnapshot) are resolved once
// server-side at add time, the same philosophy as OrderItem.priceSnapshot -
// so every guest's screen renders identically without needing its own copy
// of the full menu catalog.
@Entity('shared_cart_items')
export class SharedCartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  tableSessionId: string;

  @ManyToOne(() => TableSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tableSessionId' })
  tableSession: TableSession;

  @Index()
  @Column()
  guestId: string;

  @ManyToOne(() => TableSessionGuest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guestId' })
  guest: TableSessionGuest;

  @Column()
  menuItemId: string;

  @Column({ type: 'varchar', nullable: true })
  menuItemVariantId: string | null;

  @Column({ type: 'simple-json', nullable: true })
  modifierOptionIds: string[] | null;

  @Column()
  nameSnapshot: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPriceSnapshot: string;

  @Column({ type: 'simple-json', nullable: true })
  modifierNamesSnapshot: string[] | null;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  addedAt: Date;
}
