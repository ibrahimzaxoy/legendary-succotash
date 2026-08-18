import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';

// e.g. Pizza, Hookah, Grill, Bar, Cold/Salads, Dessert, Expo.
// Each menu item is routed to exactly one station (see MenuItem.kitchenStationId);
// the Expo station is the aggregation point where all of a table's stations
// come together before the order goes out.
@Entity('kitchen_stations')
@Index(['branchId', 'name'], { unique: true })
export class KitchenStation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column()
  name: string;

  // True only for the aggregation/pass station (see class doc above) - all
  // other stations (Pizza, Hookah, Grill, ...) leave this false.
  @Column({ default: false })
  isExpo: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}
