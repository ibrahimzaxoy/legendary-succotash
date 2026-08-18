import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
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
}
