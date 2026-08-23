import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller()
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Post('promo-codes')
  create(@Body() dto: CreatePromoCodeDto) {
    return this.promotionsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Get('promo-codes')
  findAll(@Query('restaurantId') restaurantId: string) {
    return this.promotionsService.findAllForRestaurant(restaurantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Patch('promo-codes/:id')
  update(@Param('id') id: string, @Body() dto: UpdatePromoCodeDto) {
    return this.promotionsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Delete('promo-codes/:id')
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }

  // Public: checkout preview, before the order (and any auth context) exists.
  @Post('promotions/validate')
  validate(@Body() dto: ValidatePromoCodeDto) {
    return this.promotionsService.preview(dto.branchId, dto.code, dto.subtotal);
  }
}
