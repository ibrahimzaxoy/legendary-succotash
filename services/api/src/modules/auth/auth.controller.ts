import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';
import { RefreshDto } from './dto/refresh.dto';

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

  // Trades a refresh token for a new access/refresh pair - what keeps a
  // kitchen display or waiter tablet logged in across a full shift without
  // re-entering credentials every time the short-lived access token expires.
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }
}
