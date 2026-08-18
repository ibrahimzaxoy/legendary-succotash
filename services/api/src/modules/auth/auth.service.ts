import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { StaffService } from '../staff/staff.service';
import { Staff } from '../staff/entities/staff.entity';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  staff: Pick<Staff, 'id' | 'fullName' | 'role' | 'restaurantId' | 'branchId'>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly staffService: StaffService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async loginWithPassword(email: string, password: string): Promise<AuthTokens> {
    const staff = await this.staffService.findByEmailWithSecrets(email);
    if (!staff || !staff.passwordHash || !staff.active) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, staff.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(staff);
  }

  async loginWithPin(staffId: string, pin: string): Promise<AuthTokens> {
    const staff = await this.staffService.findByIdWithSecrets(staffId);
    if (!staff || !staff.pinHash || !staff.active) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(pin, staff.pinHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(staff);
  }

  // Long-lived unattended clients (kitchen displays, waiter tablets left
  // logged in for a whole shift) can't re-prompt for credentials every time
  // the 15-minute access token expires, so every login also issues a
  // refresh token (7d) that trades itself for a new pair via /auth/refresh.
  async refresh(refreshToken: string): Promise<AuthTokens> {
    let staffId: string;
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      staffId = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const staff = await this.staffService.findOne(staffId);
    if (!staff.active) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    return this.issueTokens(staff);
  }

  private issueTokens(staff: Staff): AuthTokens {
    const payload = {
      sub: staff.id,
      restaurantId: staff.restaurantId,
      branchId: staff.branchId,
      role: staff.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(
        { sub: staff.id },
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
        },
      ),
      staff: {
        id: staff.id,
        fullName: staff.fullName,
        role: staff.role,
        restaurantId: staff.restaurantId,
        branchId: staff.branchId,
      },
    };
  }
}
