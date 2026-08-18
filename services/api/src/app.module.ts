import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { typeOrmDataSourceOptions } from './config/typeorm.config';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { BranchesModule } from './modules/branches/branches.module';
import { StaffModule } from './modules/staff/staff.module';
import { AuthModule } from './modules/auth/auth.module';
import { TablesModule } from './modules/tables/tables.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { AccountingModule } from './modules/accounting/accounting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => typeOrmDataSourceOptions,
    }),
    RestaurantsModule,
    BranchesModule,
    StaffModule,
    AuthModule,
    TablesModule,
    KitchenModule,
    MenuModule,
    OrdersModule,
    PaymentsModule,
    DeliveriesModule,
    AccountingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
