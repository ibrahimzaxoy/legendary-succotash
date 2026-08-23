import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser, AuthenticatedStaff } from '../../common/decorators/current-user.decorator';

const MANAGE_ROSTER_ROLES = [Role.OWNER, Role.ADMIN, Role.MANAGER];

@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_ROSTER_ROLES)
  @Post('shift-templates')
  createShiftTemplate(@Body() dto: CreateShiftTemplateDto) {
    return this.attendanceService.createShiftTemplate(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('shift-templates')
  findShiftTemplates(@Query('branchId') branchId: string) {
    return this.attendanceService.findShiftTemplatesForBranch(branchId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_ROSTER_ROLES)
  @Patch('shift-templates/:id/deactivate')
  deactivateShiftTemplate(@Param('id') id: string) {
    return this.attendanceService.deactivateShiftTemplate(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_ROSTER_ROLES)
  @Post('shift-assignments')
  createShiftAssignment(@Body() dto: CreateShiftAssignmentDto) {
    return this.attendanceService.createShiftAssignment(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('shift-assignments')
  findRoster(@Query('branchId') branchId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.attendanceService.findRosterForBranch(branchId, from, to);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_ROSTER_ROLES)
  @Delete('shift-assignments/:id')
  deleteShiftAssignment(@Param('id') id: string) {
    return this.attendanceService.deleteShiftAssignment(id);
  }

  // Self-service: any authenticated staff member clocks themselves in/out -
  // scoped off the JWT, not a param, exactly like the Rider App's shift toggle.
  @UseGuards(JwtAuthGuard)
  @Get('attendance/me/open')
  myOpenRecord(@CurrentUser() user: AuthenticatedStaff) {
    return this.attendanceService.findOpenRecordForStaff(user.staffId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('attendance/clock-in')
  clockIn(@CurrentUser() user: AuthenticatedStaff) {
    return this.attendanceService.clockIn(user.branchId, user.staffId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('attendance/clock-out')
  clockOut(@CurrentUser() user: AuthenticatedStaff) {
    return this.attendanceService.clockOut(user.staffId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_ROSTER_ROLES)
  @Get('attendance')
  findRecords(@Query('branchId') branchId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.attendanceService.findRecordsForBranch(branchId, from, to);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_ROSTER_ROLES)
  @Get('attendance/hours-summary')
  hoursSummary(@Query('branchId') branchId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.attendanceService.hoursSummary(branchId, from, to);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_ROSTER_ROLES)
  @Get('attendance/absences')
  absences(@Query('branchId') branchId: string, @Query('date') date: string) {
    return this.attendanceService.absencesForDate(branchId, date);
  }
}
