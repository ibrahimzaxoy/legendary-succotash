import { IsInt, IsOptional, IsString } from 'class-validator';

// Positive to grant points, negative to claw them back - zero is rejected
// by the service (nothing to adjust).
export class AdjustLoyaltyPointsDto {
  @IsInt()
  points: number;

  @IsOptional()
  @IsString()
  note?: string;
}
