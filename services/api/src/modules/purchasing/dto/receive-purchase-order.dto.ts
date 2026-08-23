import { ArrayNotEmpty, IsArray, IsNumberString, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReceiptLineInputDto {
  @IsUUID()
  purchaseOrderItemId: string;

  @IsNumberString()
  quantityReceived: string;
}

export class ReceivePurchaseOrderDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReceiptLineInputDto)
  lines: ReceiptLineInputDto[];
}
