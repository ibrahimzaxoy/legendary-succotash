import { IsNumberString, IsString, IsUUID } from 'class-validator';

export class ValidatePromoCodeDto {
  @IsUUID()
  branchId: string;

  @IsString()
  code: string;

  @IsNumberString()
  subtotal: string;
}
