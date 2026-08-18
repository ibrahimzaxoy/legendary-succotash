import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateMenuItemVariantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumberString()
  priceDelta: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateModifierOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumberString()
  priceDelta: string;
}

export class CreateModifierGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSelect?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelect?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModifierOptionDto)
  options?: CreateModifierOptionDto[];
}

export class CreateMenuItemDto {
  @IsUUID()
  branchId: string;

  @IsUUID()
  categoryId: string;

  @IsUUID()
  kitchenStationId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumberString()
  basePrice: string;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuItemVariantDto)
  variants?: CreateMenuItemVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModifierGroupDto)
  modifierGroups?: CreateModifierGroupDto[];
}
