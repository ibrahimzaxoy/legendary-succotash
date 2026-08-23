import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { InventoryAdjustment } from './entities/inventory-adjustment.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, RecipeIngredient, InventoryAdjustment]), OrdersModule],
  providers: [InventoryService],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
