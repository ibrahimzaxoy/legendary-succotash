import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser, AuthenticatedStaff } from '../../common/decorators/current-user.decorator';

const LOG_EXPENSE_ROLES = [Role.CASHIER, Role.MANAGER, Role.ADMIN, Role.OWNER];
const MANAGE_CATEGORY_ROLES = [Role.OWNER, Role.ADMIN, Role.MANAGER];

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_CATEGORY_ROLES)
  @Post('categories')
  createCategory(@Body() dto: CreateExpenseCategoryDto) {
    return this.expensesService.createCategory(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('categories')
  findCategories(@Query('restaurantId') restaurantId: string) {
    return this.expensesService.findCategoriesForRestaurant(restaurantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...LOG_EXPENSE_ROLES)
  @Post()
  log(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthenticatedStaff) {
    return this.expensesService.log(dto, user.staffId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MANAGE_CATEGORY_ROLES)
  @Get()
  findForBranch(@Query('branchId') branchId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.expensesService.findForBranch(branchId, from, to);
  }
}
