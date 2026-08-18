import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';
import { RestaurantTable } from './entities/table.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { TableStatus } from '../../common/enums/order.enum';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(RestaurantTable)
    private readonly tables: Repository<RestaurantTable>,
    private readonly config: ConfigService,
  ) {}

  create(dto: CreateTableDto): Promise<RestaurantTable> {
    const table = this.tables.create({
      ...dto,
      status: TableStatus.FREE,
      qrToken: randomBytes(24).toString('base64url'),
    });
    return this.tables.save(table);
  }

  findAllForBranch(branchId: string): Promise<RestaurantTable[]> {
    return this.tables.find({ where: { branchId } });
  }

  async findOne(id: string): Promise<RestaurantTable> {
    const table = await this.tables.findOne({ where: { id } });
    if (!table) {
      throw new NotFoundException(`Table ${id} not found`);
    }
    return table;
  }

  // Validates the token embedded in a scanned QR code before letting the
  // table PWA attach an order to this table.
  async findByQrToken(id: string, token: string): Promise<RestaurantTable> {
    const table = await this.findOne(id);
    if (table.qrToken !== token) {
      throw new NotFoundException('Invalid table QR code');
    }
    return table;
  }

  async setStatus(id: string, status: TableStatus): Promise<RestaurantTable> {
    const table = await this.findOne(id);
    table.status = status;
    return this.tables.save(table);
  }

  buildOrderUrl(table: RestaurantTable): string {
    const base = this.config.get<string>('TABLE_ORDER_BASE_URL') || '';
    return `${base}/t/${table.id}?tk=${table.qrToken}`;
  }

  async generateQrPngDataUrl(table: RestaurantTable): Promise<string> {
    return QRCode.toDataURL(this.buildOrderUrl(table));
  }
}
