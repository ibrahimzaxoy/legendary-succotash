import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedStaff {
  staffId: string;
  restaurantId: string;
  branchId: string | null;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedStaff => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
