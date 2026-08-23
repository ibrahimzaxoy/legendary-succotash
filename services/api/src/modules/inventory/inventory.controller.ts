import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SetRecipeIngredientDto } from './dto/set-recipe-ingredient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser, AuthenticatedStaff } from '../../common/decorators/current-user.decorator';

const INVENTORY_ROLES = [Role.OWNER, Role.ADMIN, Role.MANAGER];

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...INVENTORY_ROLES)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('inventory-items')
  createItem(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(dto);
  }

  @Get('inventory-items')
  findItems(@Query('branchId') branchId: string) {
    return this.inventoryService.findItemsForBranch(branchId);
  }

  @Get('inventory-items/low-stock')
  findLowStock(@Query('branchId') branchId: string) {
    return this.inventoryService.findLowStockForBranch(branchId);
  }

  @Get('inventory-items/cogs')
  async cogs(@Query('branchId') branchId: string, @Query('from') from: string, @Query('to') to: string) {
    const amount = await this.inventoryService.cogsForPeriod(branchId, new Date(from), new Date(to));
    return { branchId, from, to, amount };
  }

  @Patch('inventory-items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.updateItem(id, dto);
  }

  @Post('inventory-items/:id/adjust')
  adjustStock(@Param('id') id: string, @Body() dto: AdjustStockDto, @CurrentUser() user: AuthenticatedStaff) {
    return this.inventoryService.adjustStock(id, dto, user.staffId);
  }

  @Post('recipe-ingredients')
  setRecipeIngredient(@Body() dto: SetRecipeIngredientDto) {
    return this.inventoryService.setRecipeIngredient(dto);
  }

  @Get('recipe-ingredients/menu-item/:menuItemId')
  findRecipe(@Param('menuItemId') menuItemId: string) {
    return this.inventoryService.findRecipeForMenuItem(menuItemId);
  }

  @Delete('recipe-ingredients/:id')
  removeRecipeIngredient(@Param('id') id: string) {
    return this.inventoryService.removeRecipeIngredient(id);
  }
}
