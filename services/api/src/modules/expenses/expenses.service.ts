import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ExpenseCategory } from './entities/expense-category.entity';
import { Expense } from './entities/expense.entity';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { LedgerEntryType } from '../../common/enums/payment.enum';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(ExpenseCategory)
    private readonly categories: Repository<ExpenseCategory>,
    @InjectRepository(Expense)
    private readonly expenses: Repository<Expense>,
    private readonly accountingService: AccountingService,
  ) {}

  createCategory(dto: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
    return this.categories.save(this.categories.create(dto));
  }

  findCategoriesForRestaurant(restaurantId: string): Promise<ExpenseCategory[]> {
    return this.categories.find({ where: { restaurantId }, order: { name: 'ASC' } });
  }

  async log(dto: CreateExpenseDto, loggedByStaffId: string): Promise<Expense> {
    const expense = await this.expenses.save(
      this.expenses.create({
        ...dto,
        loggedByStaffId,
        spentAt: dto.spentAt ?? new Date().toISOString().slice(0, 10),
      }),
    );

    await this.accountingService.record(dto.branchId, null, [
      { type: LedgerEntryType.EXPENSE, amount: dto.amount, note: `expense:${expense.id} ${dto.description}` },
    ]);

    return expense;
  }

  findForBranch(branchId: string, from?: string, to?: string): Promise<Expense[]> {
    return this.expenses.find({
      where: from && to ? { branchId, spentAt: Between(from, to) } : { branchId },
      relations: ['category', 'loggedBy'],
      order: { spentAt: 'DESC' },
    });
  }
}
