import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseOrderReceipt } from './entities/purchase-order-receipt.entity';
import { PurchaseOrderReceiptLine } from './entities/purchase-order-receipt-line.entity';
import { SupplierPayment } from './entities/supplier-payment.entity';
import { PurchasingService } from './purchasing.service';
import { PurchasingController } from './purchasing.controller';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier, PurchaseOrder, PurchaseOrderItem, PurchaseOrderReceipt, PurchaseOrderReceiptLine, SupplierPayment]),
    AccountingModule,
  ],
  providers: [PurchasingService],
  controllers: [PurchasingController],
  exports: [PurchasingService],
})
export class PurchasingModule {}
