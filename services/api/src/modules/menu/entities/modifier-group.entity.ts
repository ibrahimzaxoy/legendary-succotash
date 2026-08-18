import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MenuItem } from './menu-item.entity';
import { ModifierOption } from './modifier-option.entity';

// e.g. "Choose spice level" (required, single-select) or
// "Extra toppings" (optional, multi-select, each option can upcharge).
@Entity('modifier_groups')
export class ModifierGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  menuItemId: string;

  @ManyToOne(() => MenuItem, (item) => item.modifierGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  @Column()
  name: string;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: 1 })
  minSelect: number;

  @Column({ default: 1 })
  maxSelect: number;

  @OneToMany(() => ModifierOption, (option) => option.modifierGroup)
  options: ModifierOption[];
}
