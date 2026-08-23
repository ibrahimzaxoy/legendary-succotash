import { IsNumberString, IsOptional, IsUUID } from 'class-validator';

export class SetRecipeIngredientDto {
  @IsUUID()
  menuItemId: string;

  @IsOptional()
  @IsUUID()
  menuItemVariantId?: string;

  @IsUUID()
  inventoryItemId: string;

  @IsNumberString()
  quantityRequired: string;
}
