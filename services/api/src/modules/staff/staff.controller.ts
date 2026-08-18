import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

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

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }
}
