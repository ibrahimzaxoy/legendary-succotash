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

  // Optional link to an Inventory ingredient - when set, receiving this
  // line also updates that ingredient's stock/cost (see InventoryModule).
  // Left unlinked, the line is still a valid free-text purchase record.
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;
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
