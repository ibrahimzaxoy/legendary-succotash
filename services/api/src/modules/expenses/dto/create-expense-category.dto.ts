import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsUUID()
  restaurantId: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
