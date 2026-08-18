import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

const MANAGE_MENU_ROLES = [Role.OWNER, Role.ADMIN, Role.MANAGER];

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_MENU_ROLES)
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
  @Roles(...MANAGE_MENU_ROLES)
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateMenuCategoryDto) {
    return this.menuService.updateCategory(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_MENU_ROLES)
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.menuService.deleteCategory(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_MENU_ROLES)
  @Post('items')
  createItem(@Body() dto: CreateMenuItemDto) {
    return this.menuService.createItem(dto);
  }

  // The Management Dashboard's item list - unlike GET /menu/items (used by
  // every ordering channel), this includes 86'd items so they can be
  // re-enabled. Its own path (not a query flag on /menu/items) so it can
  // stay staff-only without touching the public endpoint every guest app relies on.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_MENU_ROLES)
  @Get('admin/items')
  findAllItemsForAdmin(@Query('branchId') branchId: string) {
    return this.menuService.findAllItemsForBranchAdmin(branchId);
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
  @Roles(...MANAGE_MENU_ROLES)
  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.updateItem(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_MENU_ROLES)
  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.menuService.deleteItem(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.KITCHEN)
  @Patch('items/:id/availability')
  setAvailability(@Param('id') id: string, @Body() dto: SetAvailabilityDto) {
    return this.menuService.setAvailability(id, dto.isAvailable);
  }
}
