import { IsDateString, IsUUID } from 'class-validator';

export class CreateShiftAssignmentDto {
  @IsUUID()
  branchId: string;

  @IsUUID()
  staffId: string;

  @IsUUID()
  shiftTemplateId: string;

  @IsDateString()
  date: string;
}
