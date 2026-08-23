import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { IsNull, Repository } from 'typeorm';
import { connect } from 'net';
import { PrinterConfig } from './entities/printer-config.entity';
import { PrintJobLog } from './entities/print-job-log.entity';
import { CreatePrinterConfigDto } from './dto/create-printer-config.dto';
import { UpdatePrinterConfigDto } from './dto/update-printer-config.dto';
import { PrintJobStatus, PrintJobType } from '../../common/enums/printing.enum';
import { EscPosBuilder } from './escpos.util';
import { ORDER_ITEM_CREATED, OrderItemCreatedEvent } from '../kitchen/kitchen.events';
import type { Order } from '../orders/entities/order.entity';
import type { Payment } from '../payments/entities/payment.entity';

const SOCKET_TIMEOUT_MS = 3000;

@Injectable()
export class PrintingService {
  private readonly logger = new Logger(PrintingService.name);

  constructor(
    @InjectRepository(PrinterConfig)
    private readonly printers: Repository<PrinterConfig>,
    @InjectRepository(PrintJobLog)
    private readonly jobLogs: Repository<PrintJobLog>,
  ) {}

  // --- Printer config CRUD ---

  create(dto: CreatePrinterConfigDto): Promise<PrinterConfig> {
    return this.printers.save(this.printers.create({ ...dto, kitchenStationId: dto.kitchenStationId ?? null }));
  }

  findAllForBranch(branchId: string): Promise<PrinterConfig[]> {
    return this.printers.find({ where: { branchId }, order: { name: 'ASC' } });
  }

  async update(id: string, dto: UpdatePrinterConfigDto): Promise<PrinterConfig> {
    const printer = await this.printers.findOne({ where: { id } });
    if (!printer) throw new NotFoundException(`Printer ${id} not found`);
    Object.assign(printer, dto);
    return this.printers.save(printer);
  }

  async remove(id: string): Promise<void> {
    await this.printers.delete(id);
  }

  findJobsForBranch(branchId: string): Promise<PrintJobLog[]> {
    return this.jobLogs
      .createQueryBuilder('job')
      .innerJoin('job.printerConfig', 'printer')
      .where('printer.branchId = :branchId', { branchId })
      .orderBy('job.createdAt', 'DESC')
      .take(100)
      .getMany();
  }

  // --- Trigger points ---

  // Same event the Kitchen Display's own gateway listens to, so a printed
  // ticket stays in lockstep with what's already on-screen.
  @OnEvent(ORDER_ITEM_CREATED)
  async handleItemCreated(event: OrderItemCreatedEvent): Promise<void> {
    const printer = await this.printers.findOne({
      where: { branchId: event.branchId, kitchenStationId: event.stationId, active: true },
    });
    if (!printer) return; // no printer configured for this station - not a failure, just nothing to do

    const builder = new EscPosBuilder()
      .bold(true)
      .doubleSize(true)
      .text(event.tableNumber ? `TABLE ${event.tableNumber}` : event.channel.replace(/_/g, ' ').toUpperCase())
      .doubleSize(false)
      .bold(false)
      .divider()
      .bold(true)
      .text(`${event.quantity}x ${event.name}`)
      .bold(false);
    for (const modifier of event.modifiers) builder.text(`  + ${modifier}`);
    if (event.notes) builder.text(`  note: ${event.notes}`);
    builder.divider().text(new Date(event.createdAt).toLocaleTimeString()).feed(2).cut();

    await this.sendToPrinter(printer, PrintJobType.KITCHEN_TICKET, event.orderItemId, builder.build());
  }

  // Guest pre-bill, requested from the Table PWA before the cashier closes
  // the check - printed to the branch's general (kitchenStationId null) printer.
  async printPreBillForOrder(order: Order): Promise<void> {
    const printer = await this.findReceiptPrinter(order.branchId);
    if (!printer) return;
    const builder = this.buildBillContent(order, 'PRE-BILL (not a receipt)');
    await this.sendToPrinter(printer, PrintJobType.PRE_BILL, order.id, builder.build());
  }

  // Final itemized receipt, printed once a payment is actually captured.
  async printReceiptForOrder(order: Order, payment: Payment): Promise<void> {
    const printer = await this.findReceiptPrinter(order.branchId);
    if (!printer) return;
    const builder = this.buildBillContent(order, 'RECEIPT');
    builder.divider().text(`Paid (${payment.method}): ${payment.amount}`);
    if (Number(payment.tipAmount) > 0) builder.text(`Tip: ${payment.tipAmount}`);
    builder.feed(2).cut();
    await this.sendToPrinter(printer, PrintJobType.RECEIPT, order.id, builder.build());
  }

  private buildBillContent(order: Order, heading: string): EscPosBuilder {
    const builder = new EscPosBuilder().bold(true).text(heading).bold(false).divider();
    for (const item of order.items) {
      builder.text(`${item.quantity}x ${item.nameSnapshot}  ${item.priceSnapshot}`);
      for (const modifier of item.modifiers ?? []) builder.text(`  + ${modifier.nameSnapshot}`);
    }
    builder.divider().text(`Subtotal: ${order.subtotal}`).text(`Tax: ${order.tax}`).text(`Discount: ${order.discount}`);
    builder.bold(true).text(`Total: ${order.total}`).bold(false);
    return builder;
  }

  private findReceiptPrinter(branchId: string): Promise<PrinterConfig | null> {
    return this.printers.findOne({ where: { branchId, kitchenStationId: IsNull(), active: true } });
  }

  // Opens a raw TCP socket directly to the printer and streams the ESC/POS
  // byte buffer, fire-and-forget relative to whatever triggered it - see
  // IMPLEMENTATION_PLAN.md §17's "printing never blocks the order flow"
  // decision. A printer being offline only ever produces a logged PrintJobLog
  // row, never a thrown error the caller has to handle.
  private sendToPrinter(printer: PrinterConfig, jobType: PrintJobType, referenceId: string, payload: Buffer): Promise<void> {
    return new Promise((resolve) => {
      const socket = connect({ host: printer.ipAddress, port: printer.port, timeout: SOCKET_TIMEOUT_MS });
      let settled = false;

      const finish = async (status: PrintJobStatus, errorMessage: string | null) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        if (status === PrintJobStatus.FAILED) {
          this.logger.warn(`Print job failed on printer ${printer.name} (${printer.ipAddress}:${printer.port}): ${errorMessage}`);
        }
        await this.jobLogs.save(this.jobLogs.create({ printerConfigId: printer.id, jobType, referenceId, status, errorMessage }));
        resolve();
      };

      socket.on('connect', () => {
        socket.write(payload, (err) => {
          if (err) void finish(PrintJobStatus.FAILED, err.message);
          else void finish(PrintJobStatus.SENT, null);
        });
      });
      socket.on('timeout', () => void finish(PrintJobStatus.FAILED, 'connection timed out'));
      socket.on('error', (err) => void finish(PrintJobStatus.FAILED, err.message));
    });
  }
}
