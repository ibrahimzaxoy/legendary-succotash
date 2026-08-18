import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  create(@Body() dto: CreateDeliveryDto) {
    return this.deliveriesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN, Role.OWNER)
  @Patch(':id/assign-driver')
  assignDriver(@Param('id') id: string, @Body() dto: AssignDriverDto) {
    return this.deliveriesService.assignDriver(id, dto.driverStaffId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RIDER, Role.MANAGER, Role.ADMIN, Role.OWNER)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDeliveryStatusDto) {
    return this.deliveriesService.updateStatus(id, dto.status);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('branchId') branchId: string) {
    return this.deliveriesService.findAllForBranch(branchId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('driver/:driverStaffId')
  findForDriver(@Param('driverStaffId') driverStaffId: string) {
    return this.deliveriesService.findAllForDriver(driverStaffId);
  }
}
