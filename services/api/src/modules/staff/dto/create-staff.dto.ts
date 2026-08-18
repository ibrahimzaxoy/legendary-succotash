import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateStaffDto {
  @IsUUID()
  restaurantId: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(Role)
  role: Role;

  // At least one of these should be set: password for back-office roles,
  // pin for fast shared-tablet login (waiter/cashier/kitchen/rider).
  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  pin?: string;
}
