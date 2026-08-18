import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Post()
  create(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('branchId') branchId: string) {
    return this.tablesService.findAllForBranch(branchId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  // Public: the table PWA calls this right after scanning the QR code to
  // validate the token and load the table-specific menu/session, no login required.
  @Get(':id/scan')
  async scan(@Param('id') id: string, @Query('tk') token: string) {
    const table = await this.tablesService.findByQrToken(id, token);
    return { id: table.id, number: table.number, branchId: table.branchId, status: table.status };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Get(':id/qr')
  async qr(@Param('id') id: string) {
    const table = await this.tablesService.findOne(id);
    return { url: this.tablesService.buildOrderUrl(table), qrPngDataUrl: await this.tablesService.generateQrPngDataUrl(table) };
  }
}
