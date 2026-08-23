import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseOrderReceipt } from './entities/purchase-order-receipt.entity';
import { PurchaseOrderReceiptLine } from './entities/purchase-order-receipt-line.entity';
import { SupplierPayment } from './entities/supplier-payment.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { RecordSupplierPaymentDto } from './dto/record-supplier-payment.dto';
import { PurchaseOrderStatus } from '../../common/enums/purchasing.enum';
import { LedgerEntryType } from '../../common/enums/payment.enum';
import { AccountingService } from '../accounting/accounting.service';

const OWED_STATUSES = [PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.PARTIALLY_RECEIVED, PurchaseOrderStatus.RECEIVED];

@Injectable()
export class PurchasingService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrders: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly purchaseOrderItems: Repository<PurchaseOrderItem>,
    @InjectRepository(PurchaseOrderReceipt)
    private readonly receipts: Repository<PurchaseOrderReceipt>,
    @InjectRepository(PurchaseOrderReceiptLine)
    private readonly receiptLines: Repository<PurchaseOrderReceiptLine>,
    @InjectRepository(SupplierPayment)
    private readonly supplierPayments: Repository<SupplierPayment>,
    private readonly accountingService: AccountingService,
  ) {}

  // --- Suppliers ---

  createSupplier(dto: CreateSupplierDto): Promise<Supplier> {
    return this.suppliers.save(this.suppliers.create(dto));
  }

  findSuppliersForRestaurant(restaurantId: string): Promise<Supplier[]> {
    return this.suppliers.find({ where: { restaurantId, active: true }, order: { name: 'ASC' } });
  }

  async findSupplier(id: string): Promise<Supplier> {
    const supplier = await this.suppliers.findOne({ where: { id } });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return supplier;
  }

  // Computed, not stored, so it can never drift from the underlying
  // purchase orders/payments - the same "derive, don't duplicate"
  // principle the accounting summary already follows.
  async supplierBalance(supplierId: string): Promise<{ owed: number; paid: number; balance: number }> {
    const orders = await this.purchaseOrders.find({
      where: { supplierId, status: In(OWED_STATUSES) },
      relations: ['items'],
    });
    const owed = orders.reduce((sum, po) => sum + po.items.reduce((s, i) => s + Number(i.lineTotal), 0), 0);

    const payments = await this.supplierPayments.find({ where: { supplierId } });
    const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return { owed, paid, balance: owed - paid };
  }

  // --- Purchase orders ---

  createPurchaseOrder(dto: CreatePurchaseOrderDto, createdByStaffId: string): Promise<PurchaseOrder> {
    const po = this.purchaseOrders.create({
      branchId: dto.branchId,
      supplierId: dto.supplierId,
      expectedAt: dto.expectedAt ?? null,
      notes: dto.notes ?? null,
      createdByStaffId,
      items: dto.items.map((item) =>
        this.purchaseOrderItems.create({
          itemName: item.itemName,
          unit: item.unit ?? null,
          quantityOrdered: item.quantityOrdered,
          unitCost: item.unitCost,
          lineTotal: (Number(item.quantityOrdered) * Number(item.unitCost)).toFixed(2),
        }),
      ),
    });
    return this.purchaseOrders.save(po);
  }

  async markOrdered(id: string): Promise<PurchaseOrder> {
    const po = await this.findPurchaseOrder(id);
    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(`Purchase order must be in draft to place (currently ${po.status})`);
    }
    po.status = PurchaseOrderStatus.ORDERED;
    po.orderedAt = new Date();
    return this.purchaseOrders.save(po);
  }

  async cancel(id: string): Promise<PurchaseOrder> {
    const po = await this.findPurchaseOrder(id);
    if (po.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('Cannot cancel a fully received purchase order');
    }
    po.status = PurchaseOrderStatus.CANCELLED;
    return this.purchaseOrders.save(po);
  }

  findPurchaseOrdersForBranch(branchId: string): Promise<PurchaseOrder[]> {
    return this.purchaseOrders.find({
      where: { branchId },
      relations: ['items', 'supplier'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const po = await this.purchaseOrders.findOne({ where: { id }, relations: ['items', 'supplier'] });
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    return po;
  }

  findReceiptsForPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrderReceipt[]> {
    return this.receipts.find({ where: { purchaseOrderId }, relations: ['lines'], order: { receivedAt: 'DESC' } });
  }

  // Receiving atomically: logs the receipt event, bumps each line item's
  // quantityReceived, and rolls the PO's own status up to
  // partially_received/received based on the new totals. This is also
  // where inventory stock levels will be incremented once the Inventory
  // module (a later phase) exists - the receipt-line event is already the
  // right hook point for that, no schema change needed then.
  async receive(purchaseOrderId: string, dto: ReceivePurchaseOrderDto, receivedByStaffId: string): Promise<PurchaseOrderReceipt> {
    const po = await this.findPurchaseOrder(purchaseOrderId);
    if (![PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.PARTIALLY_RECEIVED].includes(po.status)) {
      throw new BadRequestException(`Purchase order cannot be received in status ${po.status}`);
    }

    const itemsById = new Map(po.items.map((item) => [item.id, item]));
    for (const line of dto.lines) {
      const item = itemsById.get(line.purchaseOrderItemId);
      if (!item) {
        throw new BadRequestException(`Item ${line.purchaseOrderItemId} does not belong to this purchase order`);
      }
      const newReceived = Number(item.quantityReceived) + Number(line.quantityReceived);
      if (newReceived > Number(item.quantityOrdered)) {
        throw new BadRequestException(`Receiving ${line.quantityReceived} of "${item.itemName}" exceeds what was ordered`);
      }
      item.quantityReceived = newReceived.toFixed(2);
    }
    await this.purchaseOrderItems.save(Array.from(itemsById.values()));

    const receipt = await this.receipts.save(
      this.receipts.create({
        purchaseOrderId,
        receivedByStaffId,
        note: dto.note ?? null,
        lines: dto.lines.map((l) =>
          this.receiptLines.create({
            purchaseOrderItemId: l.purchaseOrderItemId,
            quantityReceived: l.quantityReceived,
          }),
        ),
      }),
    );

    const allReceived = po.items.every((item) => Number(item.quantityReceived) >= Number(item.quantityOrdered));
    const anyReceived = po.items.some((item) => Number(item.quantityReceived) > 0);
    po.status = allReceived ? PurchaseOrderStatus.RECEIVED : anyReceived ? PurchaseOrderStatus.PARTIALLY_RECEIVED : po.status;
    await this.purchaseOrders.save(po);

    return receipt;
  }

  // --- Supplier payments ---

  async recordPayment(dto: RecordSupplierPaymentDto, paidByStaffId: string): Promise<SupplierPayment> {
    const payment = await this.supplierPayments.save(this.supplierPayments.create({ ...dto, paidByStaffId }));

    await this.accountingService.record(dto.branchId, null, [
      { type: LedgerEntryType.SUPPLIER_PAYMENT, amount: dto.amount, note: `supplier_payment:${payment.id}` },
    ]);

    return payment;
  }

  findPaymentsForSupplier(supplierId: string): Promise<SupplierPayment[]> {
    return this.supplierPayments.find({ where: { supplierId }, order: { paidAt: 'DESC' } });
  }
}
