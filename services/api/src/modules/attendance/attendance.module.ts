import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftTemplate } from './entities/shift-template.entity';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShiftTemplate, ShiftAssignment, AttendanceRecord])],
  providers: [AttendanceService],
  controllers: [AttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}
