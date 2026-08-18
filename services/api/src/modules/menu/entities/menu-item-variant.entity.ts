import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MenuItem } from './menu-item.entity';

// e.g. Small/Medium/Large for a pizza. priceDelta is added to MenuItem.basePrice.
@Entity('menu_item_variants')
export class MenuItemVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  menuItemId: string;

  @ManyToOne(() => MenuItem, (item) => item.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceDelta: string;

  @Column({ default: false })
  isDefault: boolean;
}
