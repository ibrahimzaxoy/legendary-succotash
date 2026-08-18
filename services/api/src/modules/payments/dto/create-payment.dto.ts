import { IsEnum, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentMethod } from '../../../common/enums/payment.enum';

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsNumberString()
  tipAmount?: string;

  @IsOptional()
  @IsString()
  externalReference?: string;
}
