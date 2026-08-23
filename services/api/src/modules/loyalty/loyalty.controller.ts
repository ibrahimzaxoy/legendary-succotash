import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { AdjustLoyaltyPointsDto } from './dto/adjust-loyalty-points.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // Public: checkout needs this before the guest has logged into anything -
  // same trust model as GET /tables/:id/scan (a phone number the requester
  // already typed in is not sensitive to hand back).
  @Get('accounts/lookup')
  lookup(@Query('branchId') branchId: string, @Query('phone') phone: string) {
    return this.loyaltyService.lookup(branchId, phone);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Get('accounts')
  findAccounts(@Query('restaurantId') restaurantId: string, @Query('search') search?: string) {
    return this.loyaltyService.findAccountsForRestaurant(restaurantId, search);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Get('accounts/:id/ledger')
  findLedger(@Param('id') id: string) {
    return this.loyaltyService.findLedgerForAccount(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Patch('accounts/:id/adjust')
  adjust(@Param('id') id: string, @Body() dto: AdjustLoyaltyPointsDto) {
    return this.loyaltyService.adjustPoints(id, dto);
  }
}
