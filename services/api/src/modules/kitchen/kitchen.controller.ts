import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { CreateKitchenStationDto } from './dto/create-kitchen-station.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('kitchen-stations')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Post()
  create(@Body() dto: CreateKitchenStationDto) {
    return this.kitchenService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('branchId') branchId: string) {
    return this.kitchenService.findAllForBranch(branchId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kitchenService.findOne(id);
  }
}
