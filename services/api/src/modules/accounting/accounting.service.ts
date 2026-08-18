import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { LedgerEntryType } from '../../common/enums/payment.enum';

export interface LedgerLine {
  type: LedgerEntryType;
  amount: string;
  note?: string;
}

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(LedgerEntry)
    private readonly ledger: Repository<LedgerEntry>,
  ) {}

  // Append-only: called once per financial event (a captured payment, a
  // refund). Never update or delete a row - corrections are new offsetting entries.
  async record(branchId: string, orderId: string | null, lines: LedgerLine[]): Promise<LedgerEntry[]> {
    const entities = lines.map((line) =>
      this.ledger.create({ branchId, orderId, type: line.type, amount: line.amount, note: line.note ?? null }),
    );
    return this.ledger.save(entities);
  }

  async salesSummary(branchId: string, from: Date, to: Date) {
    const entries = await this.ledger.find({ where: { branchId, createdAt: Between(from, to) } });
    const totals: Record<string, number> = {};
    for (const entry of entries) {
      totals[entry.type] = (totals[entry.type] ?? 0) + Number(entry.amount);
    }
    return { branchId, from, to, totals };
  }
}
