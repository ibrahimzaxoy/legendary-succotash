import { IsEnum } from 'class-validator';
import { OrderItemStatus } from '../../../common/enums/order.enum';

// Sent by the KDS "Bump" button.
export class UpdateItemStatusDto {
  @IsEnum(OrderItemStatus)
  status: OrderItemStatus;
}
