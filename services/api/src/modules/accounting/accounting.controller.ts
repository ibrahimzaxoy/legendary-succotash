import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // Feeds the Management Dashboard's sales/reconciliation views.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Get('summary')
  summary(@Query('branchId') branchId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.accountingService.salesSummary(branchId, new Date(from), new Date(to));
  }
}
