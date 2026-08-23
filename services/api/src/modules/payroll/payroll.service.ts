import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { PayRate } from './entities/pay-rate.entity';
import { PayrollAdvance } from './entities/payroll-advance.entity';
import { PayrollRun } from './entities/payroll-run.entity';
import { PayrollLine } from './entities/payroll-line.entity';
import { PayrollAdjustment } from './entities/payroll-adjustment.entity';
import { SetPayRateDto } from './dto/set-pay-rate.dto';
import { IssueAdvanceDto } from './dto/issue-advance.dto';
import { GeneratePayrollRunDto } from './dto/generate-payroll-run.dto';
import { AddAdjustmentDto } from './dto/add-adjustment.dto';
import { PayrollAdjustmentType, PayrollAdvanceStatus, PayrollRunStatus, PayType } from '../../common/enums/hr.enum';
import { LedgerEntryType } from '../../common/enums/payment.enum';
import { StaffService } from '../staff/staff.service';
import { AttendanceService } from '../attendance/attendance.service';
import { AccountingService } from '../accounting/accounting.service';

// A monthly rate's implied hourly-equivalent, used only to price overtime
// for salaried staff - the base monthly pay itself is never derived from hours.
const STANDARD_MONTHLY_HOURS = 160;

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayRate)
    private readonly payRates: Repository<PayRate>,
    @InjectRepository(PayrollAdvance)
    private readonly advances: Repository<PayrollAdvance>,
    @InjectRepository(PayrollRun)
    private readonly runs: Repository<PayrollRun>,
    @InjectRepository(PayrollLine)
    private readonly lines: Repository<PayrollLine>,
    @InjectRepository(PayrollAdjustment)
    private readonly adjustments: Repository<PayrollAdjustment>,
    private readonly staffService: StaffService,
    private readonly attendanceService: AttendanceService,
    private readonly accountingService: AccountingService,
  ) {}

  // --- Pay rates ---

  setPayRate(dto: SetPayRateDto): Promise<PayRate> {
    return this.payRates.save(
      this.payRates.create({
        ...dto,
        overtimeMultiplier: dto.overtimeMultiplier ?? '1.5',
        effectiveFrom: dto.effectiveFrom ?? new Date().toISOString().slice(0, 10),
      }),
    );
  }

  findRatesForStaff(staffId: string): Promise<PayRate[]> {
    return this.payRates.find({ where: { staffId }, order: { effectiveFrom: 'DESC' } });
  }

  private async currentRate(staffId: string, asOf: string): Promise<PayRate | null> {
    const rates = await this.payRates.find({
      where: { staffId, effectiveFrom: LessThanOrEqual(asOf) },
      order: { effectiveFrom: 'DESC' },
      take: 1,
    });
    return rates[0] ?? null;
  }

  // --- Advances/loans ---

  issueAdvance(dto: IssueAdvanceDto, issuedByStaffId: string): Promise<PayrollAdvance> {
    return this.advances.save(
      this.advances.create({ ...dto, remainingBalance: dto.amount, issuedByStaffId, status: PayrollAdvanceStatus.ACTIVE }),
    );
  }

  findAdvancesForStaff(staffId: string): Promise<PayrollAdvance[]> {
    return this.advances.find({ where: { staffId }, order: { issuedAt: 'DESC' } });
  }

  private findActiveAdvancesForStaff(staffId: string): Promise<PayrollAdvance[]> {
    return this.advances.find({ where: { staffId, status: PayrollAdvanceStatus.ACTIVE }, order: { issuedAt: 'ASC' } });
  }

  // --- Payroll runs ---

  async generateDraftRun(dto: GeneratePayrollRunDto, generatedByStaffId: string): Promise<PayrollRun> {
    const run = await this.runs.save(
      this.runs.create({ branchId: dto.branchId, periodStart: dto.periodStart, periodEnd: dto.periodEnd, generatedByStaffId }),
    );

    const staff = await this.staffService.findAllForBranch(dto.branchId);
    const hours = await this.attendanceService.regularAndOvertimeHours(dto.branchId, dto.periodStart, dto.periodEnd);

    for (const member of staff) {
      if (!member.active) continue;
      const rate = await this.currentRate(member.id, dto.periodEnd);
      if (!rate) continue; // no pay rate configured yet - skip, not an error, so a manager can add one and regenerate

      const { regularHours, overtimeHours } = hours[member.id] ?? { regularHours: 0, overtimeHours: 0 };
      const overtimeMultiplier = Number(rate.overtimeMultiplier);

      let basePayAmount: number;
      let hourlyEquivalent: number;
      if (rate.payType === PayType.HOURLY) {
        basePayAmount = regularHours * Number(rate.baseRate);
        hourlyEquivalent = Number(rate.baseRate);
      } else {
        basePayAmount = Number(rate.baseRate);
        hourlyEquivalent = Number(rate.baseRate) / STANDARD_MONTHLY_HOURS;
      }
      const overtimeAmount = overtimeHours * hourlyEquivalent * overtimeMultiplier;

      // Pay off outstanding advances from this run, oldest first, capped at
      // what this run can actually cover - never pushes net pay negative.
      const grossBeforeAdvance = basePayAmount + overtimeAmount;
      let advanceDeduction = 0;
      const activeAdvances = await this.findActiveAdvancesForStaff(member.id);
      for (const advance of activeAdvances) {
        const remainingCapacity = grossBeforeAdvance - advanceDeduction;
        if (remainingCapacity <= 0) break;
        advanceDeduction += Math.min(remainingCapacity, Number(advance.remainingBalance));
      }

      const line = this.lines.create({
        payrollRunId: run.id,
        staffId: member.id,
        hoursWorked: regularHours.toFixed(2),
        overtimeHours: overtimeHours.toFixed(2),
        basePayAmount: basePayAmount.toFixed(2),
        overtimeAmount: overtimeAmount.toFixed(2),
        bonusAmount: '0.00',
        deductionAmount: '0.00',
        advanceDeductionAmount: advanceDeduction.toFixed(2),
        netPay: (grossBeforeAdvance - advanceDeduction).toFixed(2),
      });
      await this.lines.save(line);
    }

    return run;
  }

  async findRun(id: string): Promise<PayrollRun> {
    const run = await this.runs.findOne({ where: { id } });
    if (!run) throw new NotFoundException(`Payroll run ${id} not found`);
    return run;
  }

  findRunsForBranch(branchId: string): Promise<PayrollRun[]> {
    return this.runs.find({ where: { branchId }, order: { periodStart: 'DESC' } });
  }

  findLinesForRun(payrollRunId: string): Promise<PayrollLine[]> {
    return this.lines.find({ where: { payrollRunId }, relations: ['staff', 'adjustments'], order: { staffId: 'ASC' } });
  }

  async addAdjustment(payrollLineId: string, dto: AddAdjustmentDto, addedByStaffId: string): Promise<PayrollLine> {
    const line = await this.lines.findOne({ where: { id: payrollLineId }, relations: ['payrollRun'] });
    if (!line) throw new NotFoundException(`Payroll line ${payrollLineId} not found`);
    if (line.payrollRun.status !== PayrollRunStatus.DRAFT) {
      throw new BadRequestException('Can only adjust a draft payroll run');
    }

    await this.adjustments.save(this.adjustments.create({ payrollLineId, ...dto, addedByStaffId }));

    const delta = dto.type === PayrollAdjustmentType.BONUS ? Number(dto.amount) : -Number(dto.amount);
    if (dto.type === PayrollAdjustmentType.BONUS) {
      line.bonusAmount = (Number(line.bonusAmount) + Number(dto.amount)).toFixed(2);
    } else {
      line.deductionAmount = (Number(line.deductionAmount) + Number(dto.amount)).toFixed(2);
    }
    line.netPay = (Number(line.netPay) + delta).toFixed(2);
    return this.lines.save(line);
  }

  async finalizeRun(id: string): Promise<PayrollRun> {
    const run = await this.findRun(id);
    if (run.status !== PayrollRunStatus.DRAFT) {
      throw new BadRequestException(`Run must be in draft to finalize (currently ${run.status})`);
    }
    run.status = PayrollRunStatus.FINALIZED;
    return this.runs.save(run);
  }

  // Marking paid is the only step that touches cash: posts one
  // PAYROLL_PAYOUT ledger entry per staff member and settles the advance
  // balances this run actually paid off - matches the cash-basis ledger
  // rule (a finalized-but-unpaid run is not yet a financial event).
  async markPaid(id: string): Promise<PayrollRun> {
    const run = await this.findRun(id);
    if (run.status !== PayrollRunStatus.FINALIZED) {
      throw new BadRequestException(`Run must be finalized before it can be paid (currently ${run.status})`);
    }

    const lines = await this.findLinesForRun(id);
    for (const line of lines) {
      await this.accountingService.record(run.branchId, null, [
        { type: LedgerEntryType.PAYROLL_PAYOUT, amount: line.netPay, note: `payroll_run:${run.id} staff:${line.staffId}` },
      ]);

      if (Number(line.advanceDeductionAmount) > 0) {
        await this.settleAdvances(line.staffId, Number(line.advanceDeductionAmount));
      }
    }

    run.status = PayrollRunStatus.PAID;
    run.paidAt = new Date();
    return this.runs.save(run);
  }

  private async settleAdvances(staffId: string, amountPaid: number): Promise<void> {
    let remaining = amountPaid;
    const activeAdvances = await this.findActiveAdvancesForStaff(staffId);
    for (const advance of activeAdvances) {
      if (remaining <= 0) break;
      const applied = Math.min(remaining, Number(advance.remainingBalance));
      advance.remainingBalance = (Number(advance.remainingBalance) - applied).toFixed(2);
      if (Number(advance.remainingBalance) <= 0) {
        advance.status = PayrollAdvanceStatus.SETTLED;
      }
      await this.advances.save(advance);
      remaining -= applied;
    }
  }
}
