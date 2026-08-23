import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import { PayrollAdjustmentType } from '../../../common/enums/hr.enum';

export class AddAdjustmentDto {
  @IsEnum(PayrollAdjustmentType)
  type: PayrollAdjustmentType;

  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  note?: string;
}
