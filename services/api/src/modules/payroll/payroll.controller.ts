import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { SetPayRateDto } from './dto/set-pay-rate.dto';
import { IssueAdvanceDto } from './dto/issue-advance.dto';
import { GeneratePayrollRunDto } from './dto/generate-payroll-run.dto';
import { AddAdjustmentDto } from './dto/add-adjustment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser, AuthenticatedStaff } from '../../common/decorators/current-user.decorator';

const PAYROLL_ROLES = [Role.OWNER, Role.ADMIN, Role.MANAGER];

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_ROLES)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('pay-rates')
  setPayRate(@Body() dto: SetPayRateDto) {
    return this.payrollService.setPayRate(dto);
  }

  @Get('pay-rates/staff/:staffId')
  findRates(@Param('staffId') staffId: string) {
    return this.payrollService.findRatesForStaff(staffId);
  }

  @Post('payroll-advances')
  issueAdvance(@Body() dto: IssueAdvanceDto, @CurrentUser() user: AuthenticatedStaff) {
    return this.payrollService.issueAdvance(dto, user.staffId);
  }

  @Get('payroll-advances/staff/:staffId')
  findAdvances(@Param('staffId') staffId: string) {
    return this.payrollService.findAdvancesForStaff(staffId);
  }

  @Post('payroll-runs')
  generateDraft(@Body() dto: GeneratePayrollRunDto, @CurrentUser() user: AuthenticatedStaff) {
    return this.payrollService.generateDraftRun(dto, user.staffId);
  }

  @Get('payroll-runs')
  findRuns(@Query('branchId') branchId: string) {
    return this.payrollService.findRunsForBranch(branchId);
  }

  @Get('payroll-runs/:id/lines')
  findLines(@Param('id') id: string) {
    return this.payrollService.findLinesForRun(id);
  }

  @Post('payroll-lines/:id/adjustments')
  addAdjustment(@Param('id') id: string, @Body() dto: AddAdjustmentDto, @CurrentUser() user: AuthenticatedStaff) {
    return this.payrollService.addAdjustment(id, dto, user.staffId);
  }

  @Patch('payroll-runs/:id/finalize')
  finalize(@Param('id') id: string) {
    return this.payrollService.finalizeRun(id);
  }

  @Patch('payroll-runs/:id/mark-paid')
  markPaid(@Param('id') id: string) {
    return this.payrollService.markPaid(id);
  }
}
