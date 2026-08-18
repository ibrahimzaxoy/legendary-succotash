import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Post('categories')
  createCategory(@Body() dto: CreateMenuCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  // Public: every ordering channel (mobile app, table PWA, waiter POS) reads the menu unauthenticated.
  @Get('categories')
  findCategories(@Query('branchId') branchId: string) {
    return this.menuService.findCategoriesForBranch(branchId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Post('items')
  createItem(@Body() dto: CreateMenuItemDto) {
    return this.menuService.createItem(dto);
  }

  @Get('items')
  findItems(@Query('branchId') branchId: string, @Query('channel') channel?: 'dineIn' | 'pickup' | 'delivery') {
    return this.menuService.findItemsForBranch(branchId, channel);
  }

  @Get('items/:id')
  findItem(@Param('id') id: string) {
    return this.menuService.findItem(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.KITCHEN)
  @Patch('items/:id/availability')
  setAvailability(@Param('id') id: string, @Body() dto: SetAvailabilityDto) {
    return this.menuService.setAvailability(id, dto.isAvailable);
  }
}
