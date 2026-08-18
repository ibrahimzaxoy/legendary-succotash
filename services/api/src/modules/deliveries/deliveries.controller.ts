import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser, AuthenticatedStaff } from '../../common/decorators/current-user.decorator';

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  // Dispatcher-only: creating a Delivery record is what puts an order in
  // front of drivers to be assigned, so it's gated the same as assigning one.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN, Role.OWNER)
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
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDeliveryStatusDto, @CurrentUser() user: AuthenticatedStaff) {
    return this.deliveriesService.updateStatus(id, dto.status, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('branchId') branchId: string) {
    return this.deliveriesService.findAllForBranch(branchId);
  }

  // What the Rider app loads on login/reconnect: only the logged-in driver's
  // own deliveries, scoped off the JWT rather than a client-supplied id.
  // Registered before ':id'-shaped routes below so "me" is never mistaken
  // for a driver id (there is none here, but keeps the pattern consistent).
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedStaff) {
    return this.deliveriesService.findAllForDriver(user.staffId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('driver/:driverStaffId')
  findForDriver(@Param('driverStaffId') driverStaffId: string) {
    return this.deliveriesService.findAllForDriver(driverStaffId);
  }
}
