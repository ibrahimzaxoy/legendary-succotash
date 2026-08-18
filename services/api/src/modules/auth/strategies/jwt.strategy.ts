import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedStaff } from '../../../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  restaurantId: string;
  branchId: string | null;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedStaff {
    return {
      staffId: payload.sub,
      restaurantId: payload.restaurantId,
      branchId: payload.branchId,
      role: payload.role,
    };
  }
}
