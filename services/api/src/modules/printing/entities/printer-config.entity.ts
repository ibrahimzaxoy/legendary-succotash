import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { KitchenStation } from '../../kitchen/entities/kitchen-station.entity';
import { PrinterConnectionType } from '../../../common/enums/printing.enum';

// A kitchen-ticket printer is tied to one station (Pizza, Grill, ...); a
// receipt/pre-bill printer sits at the register or host stand and is tied
// to the branch generally, so kitchenStationId is null for those.
@Entity('printer_configs')
export class PrinterConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  kitchenStationId: string | null;

  @ManyToOne(() => KitchenStation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'kitchenStationId' })
  kitchenStation: KitchenStation | null;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: PrinterConnectionType, default: PrinterConnectionType.NETWORK_TCP })
  connectionType: PrinterConnectionType;

  @Column()
  ipAddress: string;

  // 9100 is the standard raw ESC/POS listener port most thermal printers expose.
  @Column({ default: 9100 })
  port: number;

  @Column({ type: 'int', default: 80 })
  paperWidthMm: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
