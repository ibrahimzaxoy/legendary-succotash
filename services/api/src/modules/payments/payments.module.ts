import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { CashDrawerSession } from './entities/cash-drawer-session.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, CashDrawerSession]), OrdersModule, AccountingModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
