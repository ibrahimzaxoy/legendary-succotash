import { IsBoolean } from 'class-validator';

export class SetShiftDto {
  @IsBoolean()
  onShift: boolean;
}
