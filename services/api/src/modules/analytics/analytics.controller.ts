import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('top-items')
  topItems(@Query('branchId') branchId: string, @Query('from') from: string, @Query('to') to: string, @Query('limit') limit?: string) {
    return this.analyticsService.topItems(branchId, new Date(from), new Date(to), limit ? Number(limit) : 10);
  }

  @Get('customer-retention')
  customerRetention(@Query('branchId') branchId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.analyticsService.customerRetention(branchId, new Date(from), new Date(to));
  }

  @Get('staff-performance')
  staffPerformance(@Query('branchId') branchId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.analyticsService.staffPerformance(branchId, new Date(from), new Date(to));
  }
}
