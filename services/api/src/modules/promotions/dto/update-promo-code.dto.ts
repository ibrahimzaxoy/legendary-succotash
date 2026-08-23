import { IsBoolean, IsDateString, IsInt, IsNumberString, IsOptional, Min } from 'class-validator';

export class UpdatePromoCodeDto {
  @IsOptional()
  @IsNumberString()
  value?: string;

  @IsOptional()
  @IsNumberString()
  minOrderAmount?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
