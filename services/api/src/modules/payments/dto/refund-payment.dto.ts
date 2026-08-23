import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class RefundPaymentDto {
  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
