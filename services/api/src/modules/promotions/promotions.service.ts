import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromoCode } from './entities/promo-code.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { PromoDiscountType } from '../../common/enums/promotion.enum';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(PromoCode)
    private readonly promoCodes: Repository<PromoCode>,
    @InjectRepository(Branch)
    private readonly branches: Repository<Branch>,
  ) {}

  create(dto: CreatePromoCodeDto): Promise<PromoCode> {
    return this.promoCodes.save(
      this.promoCodes.create({
        restaurantId: dto.restaurantId,
        code: dto.code.trim().toUpperCase(),
        discountType: dto.discountType,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount ?? null,
        usageLimit: dto.usageLimit ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      }),
    );
  }

  findAllForRestaurant(restaurantId: string): Promise<PromoCode[]> {
    return this.promoCodes.find({ where: { restaurantId }, order: { createdAt: 'DESC' } });
  }

  async update(id: string, dto: UpdatePromoCodeDto): Promise<PromoCode> {
    const promo = await this.promoCodes.findOne({ where: { id } });
    if (!promo) throw new NotFoundException(`Promo code ${id} not found`);
    if (dto.value !== undefined) promo.value = dto.value;
    if (dto.minOrderAmount !== undefined) promo.minOrderAmount = dto.minOrderAmount;
    if (dto.usageLimit !== undefined) promo.usageLimit = dto.usageLimit;
    if (dto.expiresAt !== undefined) promo.expiresAt = new Date(dto.expiresAt);
    if (dto.active !== undefined) promo.active = dto.active;
    return this.promoCodes.save(promo);
  }

  async remove(id: string): Promise<void> {
    await this.promoCodes.delete(id);
  }

  // Checkout-time preview - never mutates usageCount, since just typing a
  // code in shouldn't consume it (only actually placing the order does).
  async preview(branchId: string, code: string, subtotal: string): Promise<{ discountAmount: string }> {
    const promo = await this.findValidOrThrow(branchId, code, subtotal);
    return { discountAmount: this.computeDiscount(promo, subtotal) };
  }

  // Called from OrdersService.createOrder(). The usage-limit increment is a
  // single conditional UPDATE (not a separate find-then-save) so two orders
  // racing to use the last remaining redemption of a limited code can't
  // both succeed - the loser's WHERE clause matches zero rows and it gets a
  // clean "no longer available" instead of over-redeeming the code.
  async validateAndConsume(branchId: string, code: string, subtotal: string): Promise<{ promoCodeId: string; discountAmount: string }> {
    const promo = await this.findValidOrThrow(branchId, code, subtotal);
    const discountAmount = this.computeDiscount(promo, subtotal);

    const result = await this.promoCodes
      .createQueryBuilder()
      .update(PromoCode)
      .set({ usageCount: () => 'usageCount + 1' })
      .where('id = :id AND (usageLimit IS NULL OR usageCount < usageLimit)', { id: promo.id })
      .execute();
    if (result.affected === 0) {
      throw new BadRequestException(`Promo code ${code} has just reached its usage limit`);
    }

    return { promoCodeId: promo.id, discountAmount };
  }

  private async findValidOrThrow(branchId: string, code: string, subtotal: string): Promise<PromoCode> {
    const branch = await this.branches.findOne({ where: { id: branchId } });
    if (!branch) throw new NotFoundException(`Branch ${branchId} not found`);

    const promo = await this.promoCodes.findOne({ where: { restaurantId: branch.restaurantId, code: code.trim().toUpperCase() } });
    if (!promo || !promo.active) throw new BadRequestException(`Promo code ${code} is not valid`);
    if (promo.expiresAt && promo.expiresAt < new Date()) throw new BadRequestException(`Promo code ${code} has expired`);
    if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
      throw new BadRequestException(`Promo code ${code} has reached its usage limit`);
    }
    if (promo.minOrderAmount && Number(subtotal) < Number(promo.minOrderAmount)) {
      throw new BadRequestException(`Promo code ${code} requires a minimum order of ${promo.minOrderAmount}`);
    }
    return promo;
  }

  private computeDiscount(promo: PromoCode, subtotal: string): string {
    const amount =
      promo.discountType === PromoDiscountType.PERCENTAGE
        ? (Number(subtotal) * Number(promo.value)) / 100
        : Number(promo.value);
    // Never discount more than the subtotal itself.
    return Math.min(amount, Number(subtotal)).toFixed(2);
  }
}
