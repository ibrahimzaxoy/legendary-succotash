import { IsString, IsUUID, MinLength } from 'class-validator';

export class JoinTableSessionDto {
  @IsUUID()
  tableId: string;

  @IsString()
  @MinLength(8)
  deviceToken: string;
}
