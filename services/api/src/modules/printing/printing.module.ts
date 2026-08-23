import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrinterConfig } from './entities/printer-config.entity';
import { PrintJobLog } from './entities/print-job-log.entity';
import { PrintingService } from './printing.service';
import { PrintingController } from './printing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PrinterConfig, PrintJobLog])],
  providers: [PrintingService],
  controllers: [PrintingController],
  exports: [PrintingService],
})
export class PrintingModule {}
