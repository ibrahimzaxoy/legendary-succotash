import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { SplitByGuestDto, SplitEvenDto } from './dto/split-checkout.dto';
import { OpenCashDrawerDto } from './dto/open-cash-drawer.dto';
import { CloseCashDrawerDto } from './dto/close-cash-drawer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser, AuthenticatedStaff } from '../../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Only a Cashier (or manager/admin/owner covering the register) can
  // receive money and close a dine-in check.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CASHIER, Role.MANAGER, Role.ADMIN, Role.OWNER)
  @Post()
  capture(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthenticatedStaff) {
    return this.paymentsService.capture(dto, user.staffId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  findForOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.findAllForOrder(orderId);
  }

  // Split checkout - see IMPLEMENTATION_PLAN.md §18. Same cashier-only gate
  // as the single-payer capture() above: a dine-in check is still always
  // closed by a Cashier, split or not.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CASHIER, Role.MANAGER, Role.ADMIN, Role.OWNER)
  @Post('split-even')
  captureSplitEven(@Body() dto: SplitEvenDto, @CurrentUser() user: AuthenticatedStaff) {
    return this.paymentsService.captureSplitEven(dto, user.staffId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CASHIER, Role.MANAGER, Role.ADMIN, Role.OWNER)
  @Post('split-by-guest')
  captureSplitByGuest(@Body() dto: SplitByGuestDto, @CurrentUser() user: AuthenticatedStaff) {
    return this.paymentsService.captureSplitByGuest(dto, user.staffId);
  }

  // --- Cash drawer reconciliation ---
  // Self-service for the cashier operating the drawer, scoped off the JWT.

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CASHIER, Role.MANAGER, Role.ADMIN, Role.OWNER)
  @Post('cash-drawer-sessions/open')
  openCashDrawer(@Body() dto: OpenCashDrawerDto, @CurrentUser() user: AuthenticatedStaff) {
    return this.paymentsService.openCashDrawer(dto, user.staffId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('cash-drawer-sessions/mine/open')
  myOpenCashDrawer(@CurrentUser() user: AuthenticatedStaff) {
    return this.paymentsService.findOpenCashDrawerForCashier(user.staffId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CASHIER, Role.MANAGER, Role.ADMIN, Role.OWNER)
  @Patch('cash-drawer-sessions/:id/close')
  closeCashDrawer(@Param('id') id: string, @Body() dto: CloseCashDrawerDto) {
    return this.paymentsService.closeCashDrawer(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN, Role.OWNER)
  @Get('cash-drawer-sessions')
  findCashDrawerSessions(@Query('branchId') branchId: string) {
    return this.paymentsService.findCashDrawerSessionsForBranch(branchId);
  }
}
