import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { OrderItemInputDto } from './create-order.dto';

// Lets a waiter add a forgotten item to a table that's already ordering via
// QR (or vice versa) - both write to the same underlying Order.
export class AddOrderItemsDto {
  @IsOptional()
  @IsUUID()
  waiterStaffId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];
}
