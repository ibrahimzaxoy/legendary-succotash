import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { StaffService } from '../staff/staff.service';
import { Staff } from '../staff/entities/staff.entity';

export interface AuthTokens {
  accessToken: string;
  staff: Pick<Staff, 'id' | 'fullName' | 'role' | 'restaurantId' | 'branchId'>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly staffService: StaffService,
    private readonly jwtService: JwtService,
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

  private issueTokens(staff: Staff): AuthTokens {
    const payload = {
      sub: staff.id,
      restaurantId: staff.restaurantId,
      branchId: staff.branchId,
      role: staff.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
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
