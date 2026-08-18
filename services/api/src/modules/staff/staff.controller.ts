import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { SetShiftDto } from './dto/set-shift.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser, AuthenticatedStaff } from '../../common/decorators/current-user.decorator';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Post()
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Get()
  findAll(@Query('branchId') branchId: string) {
    return this.staffService.findAllForBranch(branchId);
  }

  // Public: the "tap your name" picker a shared device shows before asking
  // for a PIN. Registered before ':id' so "branch" is never swallowed as a
  // staff id. See StaffService.findLoginOptionsForBranch for why this is
  // safe to leave unauthenticated.
  @Get('branch/:branchId/login-options')
  findLoginOptions(@Param('branchId') branchId: string) {
    return this.staffService.findLoginOptionsForBranch(branchId);
  }

  // Self-service: a rider taps "Go on shift" / "Go off shift" in their own
  // app. Scoped to the caller via the JWT, not a param, so a driver can only
  // ever flip their own availability.
  @UseGuards(JwtAuthGuard)
  @Patch('me/shift')
  setMyShift(@CurrentUser() user: AuthenticatedStaff, @Body() dto: SetShiftDto) {
    return this.staffService.setOnShift(user.staffId, dto.onShift);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }
}
