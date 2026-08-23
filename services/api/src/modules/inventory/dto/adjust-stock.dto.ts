import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import { InventoryAdjustmentReason } from '../../../common/enums/inventory.enum';

// Manual corrections/waste only - purchase receipts and order deductions
// are posted internally by their own flows, not through this endpoint.
export class AdjustStockDto {
  @IsNumberString()
  quantityDelta: string;

  @IsEnum(InventoryAdjustmentReason)
  reason: InventoryAdjustmentReason.WASTE | InventoryAdjustmentReason.MANUAL_CORRECTION | InventoryAdjustmentReason.STOCKTAKE;

  @IsOptional()
  @IsString()
  note?: string;
}
