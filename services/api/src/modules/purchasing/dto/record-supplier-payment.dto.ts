import { IsEnum, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentMethod } from '../../../common/enums/payment.enum';

export class RecordSupplierPaymentDto {
  @IsUUID()
  branchId: string;

  @IsUUID()
  supplierId: string;

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsNumberString()
  amount: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  note?: string;
}
