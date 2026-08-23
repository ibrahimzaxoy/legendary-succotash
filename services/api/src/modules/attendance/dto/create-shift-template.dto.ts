import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsString, IsUUID, Matches, Max, Min } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateShiftTemplateDto {
  @IsUUID()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @Matches(TIME_PATTERN, { message: 'startTime must be HH:mm' })
  startTime: string;

  @Matches(TIME_PATTERN, { message: 'endTime must be HH:mm' })
  endTime: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek: number[];
}
