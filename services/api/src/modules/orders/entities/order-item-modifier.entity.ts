import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { ModifierOption } from '../../menu/entities/modifier-option.entity';

@Entity('order_item_modifiers')
export class OrderItemModifier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  orderItemId: string;

  @ManyToOne(() => OrderItem, (item) => item.modifiers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItem;

  @Column()
  modifierOptionId: string;

  @ManyToOne(() => ModifierOption, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'modifierOptionId' })
  modifierOption: ModifierOption;

  @Column()
  nameSnapshot: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceSnapshot: string;
}
