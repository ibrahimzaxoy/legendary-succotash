import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddOrderItemsDto } from './dto/add-order-items.dto';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { OrderStatus } from '../../common/enums/order.enum';
import { CurrentUser, AuthenticatedStaff } from '../../common/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Public: covers all three channels - mobile app checkout, table PWA
  // (guest scanned the QR, no staff login), and waiter POS (staff login
  // handled at the app level, not required to place the order here).
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Post(':id/items')
  addItems(@Param('id') id: string, @Body() dto: AddOrderItemsDto) {
    return this.ordersService.addItems(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.KITCHEN, Role.MANAGER, Role.ADMIN, Role.OWNER)
  @Patch('items/:itemId/status')
  updateItemStatus(@Param('itemId') itemId: string, @Body() dto: UpdateItemStatusDto) {
    return this.ordersService.updateItemStatus(itemId, dto.status);
  }

  @Get()
  findAll(@Query('branchId') branchId: string, @Query('status') status?: OrderStatus) {
    return this.ordersService.findAllForBranch(branchId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CASHIER, Role.MANAGER, Role.ADMIN, Role.OWNER)
  @Patch(':id/close')
  close(@Param('id') id: string, @CurrentUser() user: AuthenticatedStaff) {
    return this.ordersService.closeOrder(id, user.staffId);
  }
}
