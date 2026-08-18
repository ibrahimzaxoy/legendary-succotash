import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

// Base fields only - see MenuService.updateItem for why variants/modifier
// groups aren't editable here.
export class UpdateMenuItemDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  kitchenStationId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumberString()
  basePrice?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  availableDineIn?: boolean;

  @IsOptional()
  @IsBoolean()
  availablePickup?: boolean;

  @IsOptional()
  @IsBoolean()
  availableDelivery?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  prepTimeMinutes?: number;
}
