import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class IssueAdvanceDto {
  @IsUUID()
  staffId: string;

  @IsUUID()
  branchId: string;

  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
