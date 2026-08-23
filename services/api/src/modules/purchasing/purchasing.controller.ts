import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { RecordSupplierPaymentDto } from './dto/record-supplier-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser, AuthenticatedStaff } from '../../common/decorators/current-user.decorator';

const PURCHASING_ROLES = [Role.OWNER, Role.ADMIN, Role.MANAGER];

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PURCHASING_ROLES)
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Post('suppliers')
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.purchasingService.createSupplier(dto);
  }

  @Get('suppliers')
  findSuppliers(@Query('restaurantId') restaurantId: string) {
    return this.purchasingService.findSuppliersForRestaurant(restaurantId);
  }

  @Get('suppliers/:id')
  findSupplier(@Param('id') id: string) {
    return this.purchasingService.findSupplier(id);
  }

  @Get('suppliers/:id/balance')
  supplierBalance(@Param('id') id: string) {
    return this.purchasingService.supplierBalance(id);
  }

  @Get('suppliers/:id/payments')
  paymentsForSupplier(@Param('id') id: string) {
    return this.purchasingService.findPaymentsForSupplier(id);
  }

  @Post('purchase-orders')
  createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: AuthenticatedStaff) {
    return this.purchasingService.createPurchaseOrder(dto, user.staffId);
  }

  @Get('purchase-orders')
  findPurchaseOrders(@Query('branchId') branchId: string) {
    return this.purchasingService.findPurchaseOrdersForBranch(branchId);
  }

  @Get('purchase-orders/:id')
  findPurchaseOrder(@Param('id') id: string) {
    return this.purchasingService.findPurchaseOrder(id);
  }

  @Patch('purchase-orders/:id/place')
  markOrdered(@Param('id') id: string) {
    return this.purchasingService.markOrdered(id);
  }

  @Patch('purchase-orders/:id/cancel')
  cancel(@Param('id') id: string) {
    return this.purchasingService.cancel(id);
  }

  @Get('purchase-orders/:id/receipts')
  findReceipts(@Param('id') id: string) {
    return this.purchasingService.findReceiptsForPurchaseOrder(id);
  }

  @Post('purchase-orders/:id/receive')
  receive(@Param('id') id: string, @Body() dto: ReceivePurchaseOrderDto, @CurrentUser() user: AuthenticatedStaff) {
    return this.purchasingService.receive(id, dto, user.staffId);
  }

  @Post('supplier-payments')
  recordPayment(@Body() dto: RecordSupplierPaymentDto, @CurrentUser() user: AuthenticatedStaff) {
    return this.purchasingService.recordPayment(dto, user.staffId);
  }
}
