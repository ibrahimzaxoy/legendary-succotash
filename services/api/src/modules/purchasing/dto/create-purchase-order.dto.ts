import { ArrayNotEmpty, IsArray, IsDateString, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemInputDto {
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumberString()
  quantityOrdered: string;

  @IsNumberString()
  unitCost: string;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  branchId: string;

  @IsUUID()
  supplierId: string;

  @IsOptional()
  @IsDateString()
  expectedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemInputDto)
  items: PurchaseOrderItemInputDto[];
}
