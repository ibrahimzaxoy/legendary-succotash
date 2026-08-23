import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PrinterConfig } from './printer-config.entity';
import { PrintJobStatus, PrintJobType } from '../../../common/enums/printing.enum';

// Append-only, for failure visibility only - a print job is a fire-and-forget
// side effect, not durable state that needs a retry queue (see PrintingService).
@Entity('print_job_logs')
export class PrintJobLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  printerConfigId: string;

  @ManyToOne(() => PrinterConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'printerConfigId' })
  printerConfig: PrinterConfig;

  @Column({ type: 'enum', enum: PrintJobType })
  jobType: PrintJobType;

  // The OrderItem or Order id this job printed - no FK, purely informational.
  @Column({ type: 'varchar', nullable: true })
  referenceId: string | null;

  @Column({ type: 'enum', enum: PrintJobStatus })
  status: PrintJobStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
