import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { InventoryUnit } from '../../../common/enums/inventory.enum';

export class CreateInventoryItemDto {
  @IsUUID()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(InventoryUnit)
  unit: InventoryUnit;

  @IsOptional()
  @IsNumberString()
  currentStock?: string;

  @IsOptional()
  @IsNumberString()
  reorderThreshold?: string;

  @IsOptional()
  @IsNumberString()
  reorderQuantity?: string;
}
