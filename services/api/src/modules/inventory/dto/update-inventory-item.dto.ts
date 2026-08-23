import { IsBoolean, IsNumberString, IsOptional, IsString } from 'class-validator';

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumberString()
  reorderThreshold?: string;

  @IsOptional()
  @IsNumberString()
  reorderQuantity?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
