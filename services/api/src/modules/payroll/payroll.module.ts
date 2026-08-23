import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayRate } from './entities/pay-rate.entity';
import { PayrollAdvance } from './entities/payroll-advance.entity';
import { PayrollRun } from './entities/payroll-run.entity';
import { PayrollLine } from './entities/payroll-line.entity';
import { PayrollAdjustment } from './entities/payroll-adjustment.entity';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { StaffModule } from '../staff/staff.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PayRate, PayrollAdvance, PayrollRun, PayrollLine, PayrollAdjustment]),
    StaffModule,
    AttendanceModule,
    AccountingModule,
  ],
  providers: [PayrollService],
  controllers: [PayrollController],
  exports: [PayrollService],
})
export class PayrollModule {}
