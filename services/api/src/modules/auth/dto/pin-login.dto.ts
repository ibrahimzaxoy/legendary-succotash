import { IsString, IsUUID } from 'class-validator';

// Fast login for shared floor tablets: pick your name/staffId, enter your PIN.
export class PinLoginDto {
  @IsUUID()
  staffId: string;

  @IsString()
  pin: string;
}
