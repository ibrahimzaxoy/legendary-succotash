import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMenuCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
