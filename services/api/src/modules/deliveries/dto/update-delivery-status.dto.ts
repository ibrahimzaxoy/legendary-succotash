import { IsEnum } from 'class-validator';
import { DeliveryStatus } from '../../../common/enums/payment.enum';

export class UpdateDeliveryStatusDto {
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;
}
