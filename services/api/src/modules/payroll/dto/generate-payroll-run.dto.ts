import { IsDateString, IsUUID } from 'class-validator';

export class GeneratePayrollRunDto {
  @IsUUID()
  branchId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}
