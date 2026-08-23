import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantTable } from './entities/table.entity';
import { TableSession } from './entities/table-session.entity';
import { TableSessionGuest } from './entities/table-session-guest.entity';
import { SharedCartItem } from './entities/shared-cart-item.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { TableSessionsService } from './table-sessions.service';
import { TableSessionsController } from './table-sessions.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RestaurantTable, TableSession, TableSessionGuest, SharedCartItem, MenuItem]),
    OrdersModule,
  ],
  providers: [TablesService, TableSessionsService],
  controllers: [TablesController, TableSessionsController],
  exports: [TablesService, TableSessionsService],
})
export class TablesModule {}
