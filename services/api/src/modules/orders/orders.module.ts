import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemModifier } from './entities/order-item-modifier.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { RestaurantTable } from '../tables/entities/table.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
import { PrintingModule } from '../printing/printing.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderItemModifier, MenuItem, RestaurantTable]), PrintingModule],
  providers: [OrdersService, OrdersGateway],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
