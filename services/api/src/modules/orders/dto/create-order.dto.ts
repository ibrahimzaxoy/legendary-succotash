import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderChannel } from '../../../common/enums/order.enum';

export class OrderItemInputDto {
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

  // Set only by TableSessionsService.submit() when converting a shared
  // table-session cart into real order items - never supplied directly by
  // a client DTO in the normal single-cart ordering flow.
  @IsOptional()
  @IsUUID()
  orderedByGuestId?: string;

  @IsOptional()
  @IsString()
  orderedByGuestLabel?: string;
}

export class CreateOrderDto {
  @IsUUID()
  branchId: string;

  @IsEnum(OrderChannel)
  channel: OrderChannel;

  @IsOptional()
  @IsUUID()
  tableId?: string;

  @IsOptional()
  @IsUUID()
  waiterStaffId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];
}
