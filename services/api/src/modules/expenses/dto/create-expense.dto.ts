import { IsDateString, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateExpenseDto {
  @IsUUID()
  branchId: string;

  @IsUUID()
  categoryId: string;

  @IsNumberString()
  amount: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  receiptNote?: string;

  @IsOptional()
  @IsString()
  receiptImageUrl?: string;

  @IsOptional()
  @IsDateString()
  spentAt?: string;
}
