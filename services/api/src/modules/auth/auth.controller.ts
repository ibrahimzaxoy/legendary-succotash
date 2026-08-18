import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Back-office login for owner/admin/manager (email + password).
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.loginWithPassword(dto.email, dto.password);
  }

  // Fast shared-tablet login for waiter/cashier/kitchen/rider (staffId + PIN).
  @Post('login/pin')
  loginWithPin(@Body() dto: PinLoginDto) {
    return this.authService.loginWithPin(dto.staffId, dto.pin);
  }
}
