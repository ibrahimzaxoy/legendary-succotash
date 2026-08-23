import { IsEnum, IsInt, IsUUID, Min } from 'class-validator';
import { PaymentMethod } from '../../../common/enums/payment.enum';

export class SplitEvenDto {
  @IsUUID()
  orderId: string;

  @IsInt()
  @Min(2)
  parts: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

export class SplitByGuestDto {
  @IsUUID()
  orderId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}
