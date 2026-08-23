import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import { ShiftTemplate } from './entities/shift-template.entity';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto';
import { AttendanceStatus, ClockMethod } from '../../common/enums/hr.enum';

// Minutes after a shift's scheduled start before a clock-in counts as "late".
const LATE_GRACE_MINUTES = 10;

// Hours per single punch before the excess counts as overtime - a
// per-punch (per shift) threshold rather than a weekly bucket, since a
// payroll period can span multiple weeks and this stays correct either way.
const STANDARD_SHIFT_HOURS = 8;

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function combineDateAndTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(ShiftTemplate)
    private readonly shiftTemplates: Repository<ShiftTemplate>,
    @InjectRepository(ShiftAssignment)
    private readonly shiftAssignments: Repository<ShiftAssignment>,
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRecords: Repository<AttendanceRecord>,
  ) {}

  // --- Shift templates ---

  createShiftTemplate(dto: CreateShiftTemplateDto): Promise<ShiftTemplate> {
    return this.shiftTemplates.save(this.shiftTemplates.create(dto));
  }

  findShiftTemplatesForBranch(branchId: string): Promise<ShiftTemplate[]> {
    return this.shiftTemplates.find({ where: { branchId, active: true }, order: { startTime: 'ASC' } });
  }

  async deactivateShiftTemplate(id: string): Promise<ShiftTemplate> {
    const template = await this.shiftTemplates.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`Shift template ${id} not found`);
    template.active = false;
    return this.shiftTemplates.save(template);
  }

  // --- Roster ---

  createShiftAssignment(dto: CreateShiftAssignmentDto): Promise<ShiftAssignment> {
    return this.shiftAssignments.save(this.shiftAssignments.create(dto));
  }

  findRosterForBranch(branchId: string, from: string, to: string): Promise<ShiftAssignment[]> {
    return this.shiftAssignments.find({
      where: { branchId, date: Between(from, to) },
      relations: ['staff', 'shiftTemplate'],
      order: { date: 'ASC' },
    });
  }

  async deleteShiftAssignment(id: string): Promise<void> {
    const result = await this.shiftAssignments.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Shift assignment ${id} not found`);
  }

  // --- Clock in/out ---

  // A staff member's currently-open punch, if any - lets the kiosk show
  // "Clock out" vs "Clock in" before the staff member acts, without a
  // side-effecting toggle call.
  findOpenRecordForStaff(staffId: string): Promise<AttendanceRecord | null> {
    return this.attendanceRecords.findOne({ where: { staffId, clockOutAt: IsNull() } });
  }

  async clockIn(branchId: string | null, staffId: string): Promise<AttendanceRecord> {
    if (!branchId) {
      throw new BadRequestException('Only branch-scoped staff can clock in');
    }
    const existing = await this.findOpenRecordForStaff(staffId);
    if (existing) {
      throw new BadRequestException('Already clocked in - clock out first');
    }

    const today = todayDateString();
    const assignment = await this.shiftAssignments.findOne({
      where: { staffId, date: today },
      relations: ['shiftTemplate'],
    });

    const now = new Date();
    let status = AttendanceStatus.UNSCHEDULED;
    if (assignment) {
      const scheduledStart = combineDateAndTime(today, assignment.shiftTemplate.startTime);
      const minutesLate = (now.getTime() - scheduledStart.getTime()) / 60000;
      status = minutesLate > LATE_GRACE_MINUTES ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
    }

    const record = this.attendanceRecords.create({
      branchId,
      staffId,
      shiftAssignmentId: assignment?.id ?? null,
      clockInAt: now,
      clockInMethod: ClockMethod.PIN,
      status,
    });
    return this.attendanceRecords.save(record);
  }

  async clockOut(staffId: string): Promise<AttendanceRecord> {
    const record = await this.findOpenRecordForStaff(staffId);
    if (!record) {
      throw new BadRequestException('Not currently clocked in');
    }

    const now = new Date();
    record.clockOutAt = now;
    record.clockOutMethod = ClockMethod.PIN;
    record.totalMinutesWorked = Math.round((now.getTime() - record.clockInAt.getTime()) / 60000);

    if (record.shiftAssignmentId && record.status !== AttendanceStatus.LATE) {
      const assignment = await this.shiftAssignments.findOne({
        where: { id: record.shiftAssignmentId },
        relations: ['shiftTemplate'],
      });
      if (assignment) {
        const scheduledEnd = combineDateAndTime(assignment.date, assignment.shiftTemplate.endTime);
        if (now.getTime() < scheduledEnd.getTime()) {
          record.status = AttendanceStatus.EARLY_LEAVE;
        }
      }
    }

    return this.attendanceRecords.save(record);
  }

  // --- Reporting ---

  findRecordsForBranch(branchId: string, from: string, to: string): Promise<AttendanceRecord[]> {
    return this.attendanceRecords.find({
      where: { branchId, clockInAt: Between(new Date(`${from}T00:00:00`), new Date(`${to}T23:59:59`)) },
      relations: ['staff'],
      order: { clockInAt: 'DESC' },
    });
  }

  // Hours worked per staff member over a period - sums only closed punches.
  async hoursSummary(branchId: string, from: string, to: string): Promise<Record<string, number>> {
    const records = await this.findRecordsForBranch(branchId, from, to);
    const totals: Record<string, number> = {};
    for (const record of records) {
      if (record.totalMinutesWorked == null) continue;
      totals[record.staffId] = (totals[record.staffId] ?? 0) + record.totalMinutesWorked;
    }
    return totals;
  }

  // Regular vs. overtime hours per staff member over a period, for the
  // Payroll module. Split per punch (a single long shift's excess over
  // STANDARD_SHIFT_HOURS is overtime) rather than per week, so it stays
  // correct regardless of how the payroll period aligns to calendar weeks.
  async regularAndOvertimeHours(
    branchId: string,
    from: string,
    to: string,
  ): Promise<Record<string, { regularHours: number; overtimeHours: number }>> {
    const records = await this.findRecordsForBranch(branchId, from, to);
    const totals: Record<string, { regularHours: number; overtimeHours: number }> = {};
    for (const record of records) {
      if (record.totalMinutesWorked == null) continue;
      const hours = record.totalMinutesWorked / 60;
      const regular = Math.min(hours, STANDARD_SHIFT_HOURS);
      const overtime = Math.max(0, hours - STANDARD_SHIFT_HOURS);
      const existing = totals[record.staffId] ?? { regularHours: 0, overtimeHours: 0 };
      totals[record.staffId] = {
        regularHours: existing.regularHours + regular,
        overtimeHours: existing.overtimeHours + overtime,
      };
    }
    return totals;
  }

  // Scheduled staff on a given date who never clocked in - computed on
  // demand rather than via a nightly job, since a report is the only
  // consumer today.
  async absencesForDate(branchId: string, date: string): Promise<ShiftAssignment[]> {
    const assignments = await this.shiftAssignments.find({ where: { branchId, date }, relations: ['staff'] });
    const records = await this.attendanceRecords.find({
      where: { branchId, clockInAt: Between(new Date(`${date}T00:00:00`), new Date(`${date}T23:59:59`)) },
    });
    const staffWithAttendance = new Set(records.map((r) => r.staffId));
    return assignments.filter((a) => !staffWithAttendance.has(a.staffId));
  }
}
