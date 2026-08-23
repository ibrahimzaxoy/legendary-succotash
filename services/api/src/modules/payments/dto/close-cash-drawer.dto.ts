import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class CloseCashDrawerDto {
  @IsNumberString()
  countedClosingCash: string;

  @IsOptional()
  @IsString()
  varianceNote?: string;
}
