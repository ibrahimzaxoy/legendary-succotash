import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { MenuItem } from '../../menu/entities/menu-item.entity';
import { MenuItemVariant } from '../../menu/entities/menu-item-variant.entity';
import { KitchenStation } from '../../kitchen/entities/kitchen-station.entity';
import { OrderItemStatus } from '../../../common/enums/order.enum';
import { OrderItemModifier } from './order-item-modifier.entity';

// This is the row the Kitchen Display System actually reads: each item
// carries its own kitchen_station_id and its own status, independent of
// the other items in the same order and independent of the order's own
// (coarser) status. A pizza + a hookah on the same order produce two
// OrderItem rows routed to two different stations.
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  menuItemId: string;

  @ManyToOne(() => MenuItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  @Column({ type: 'varchar', nullable: true })
  menuItemVariantId: string | null;

  @ManyToOne(() => MenuItemVariant, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'menuItemVariantId' })
  menuItemVariant: MenuItemVariant | null;

  @Index()
  @Column()
  kitchenStationId: string;

  @ManyToOne(() => KitchenStation, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'kitchenStationId' })
  kitchenStation: KitchenStation;

  // Snapshots so historical orders/receipts never change if the menu is edited later.
  @Column()
  nameSnapshot: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceSnapshot: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'enum', enum: OrderItemStatus, default: OrderItemStatus.QUEUED })
  status: OrderItemStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => OrderItemModifier, (modifier) => modifier.orderItem, { cascade: true })
  modifiers: OrderItemModifier[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
