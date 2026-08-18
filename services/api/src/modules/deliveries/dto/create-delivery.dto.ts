import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDeliveryDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  lat?: string;

  @IsOptional()
  @IsString()
  lng?: string;
}
