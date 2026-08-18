import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ModifierGroup } from './modifier-group.entity';

@Entity('modifier_options')
export class ModifierOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  modifierGroupId: string;

  @ManyToOne(() => ModifierGroup, (group) => group.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modifierGroupId' })
  modifierGroup: ModifierGroup;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceDelta: string;
}
