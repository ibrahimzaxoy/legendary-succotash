import { IsDateString, IsEnum, IsInt, IsNumberString, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PromoDiscountType } from '../../../common/enums/promotion.enum';

export class CreatePromoCodeDto {
  @IsUUID()
  restaurantId: string;

  @IsString()
  code: string;

  @IsEnum(PromoDiscountType)
  discountType: PromoDiscountType;

  @IsNumberString()
  value: string;

  @IsOptional()
  @IsNumberString()
  minOrderAmount?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
