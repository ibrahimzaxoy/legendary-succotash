import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PrintingService } from './printing.service';
import { CreatePrinterConfigDto } from './dto/create-printer-config.dto';
import { UpdatePrinterConfigDto } from './dto/update-printer-config.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
@Controller('printer-configs')
export class PrintingController {
  constructor(private readonly printingService: PrintingService) {}

  @Post()
  create(@Body() dto: CreatePrinterConfigDto) {
    return this.printingService.create(dto);
  }

  @Get()
  findAll(@Query('branchId') branchId: string) {
    return this.printingService.findAllForBranch(branchId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePrinterConfigDto) {
    return this.printingService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.printingService.remove(id);
  }

  @Get('jobs')
  findJobs(@Query('branchId') branchId: string) {
    return this.printingService.findJobsForBranch(branchId);
  }
}
