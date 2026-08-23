import { IsDateString, IsEnum, IsNumberString, IsOptional, IsUUID } from 'class-validator';
import { PayType } from '../../../common/enums/hr.enum';

export class SetPayRateDto {
  @IsUUID()
  staffId: string;

  @IsEnum(PayType)
  payType: PayType;

  @IsNumberString()
  baseRate: string;

  @IsOptional()
  @IsNumberString()
  overtimeMultiplier?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}
