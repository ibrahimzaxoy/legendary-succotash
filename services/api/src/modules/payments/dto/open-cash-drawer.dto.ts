import { IsNumberString, IsUUID } from 'class-validator';

export class OpenCashDrawerDto {
  @IsUUID()
  branchId: string;

  @IsNumberString()
  openingFloat: string;
}
