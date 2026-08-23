import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddSharedCartItemDto {
  @IsUUID()
  guestId: string;

  @IsUUID()
  menuItemId: string;

  @IsOptional()
  @IsUUID()
  menuItemVariantId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  modifierOptionIds?: string[];

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
