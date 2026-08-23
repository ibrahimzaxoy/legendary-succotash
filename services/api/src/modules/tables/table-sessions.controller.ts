import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { TableSessionsService } from './table-sessions.service';
import { JoinTableSessionDto } from './dto/join-table-session.dto';
import { AddSharedCartItemDto } from './dto/add-shared-cart-item.dto';

// Fully public, same trust model as the rest of the table-scan flow
// (GET /tables/:id/scan) - a guest phone has no login, only the
// unguessable tableId+qrToken it scanned and, from there, its own
// self-issued deviceToken/guestId.
@Controller('table-sessions')
export class TableSessionsController {
  constructor(private readonly tableSessions: TableSessionsService) {}

  // branchId is resolved from the table itself, not trusted from the
  // client, so a session can never be opened against a mismatched branch.
  @Post('join')
  join(@Body() dto: JoinTableSessionDto) {
    return this.tableSessions.join(dto);
  }

  @Get(':id')
  getState(@Param('id') id: string, @Query('guestId') guestId: string) {
    return this.tableSessions.getState(id, guestId);
  }

  @Post(':id/cart-items')
  addCartItem(@Param('id') id: string, @Body() dto: AddSharedCartItemDto) {
    return this.tableSessions.addCartItem(id, dto);
  }

  @Delete(':id/cart-items/:itemId')
  removeCartItem(@Param('id') id: string, @Param('itemId') itemId: string, @Query('guestId') guestId: string) {
    return this.tableSessions.removeCartItem(id, itemId, guestId);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string) {
    return this.tableSessions.submit(id);
  }
}
