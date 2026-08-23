import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SubscribeDto } from './dto/subscribe.dto';

// Fully public: a guest with no account subscribes right after placing an
// order, the same trust model as GET /orders/:id already being public.
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('vapid-public-key')
  vapidPublicKey() {
    return { publicKey: this.notificationsService.getPublicKey() };
  }

  @Post('subscribe')
  subscribe(@Body() dto: SubscribeDto) {
    return this.notificationsService.subscribe(dto);
  }

  @Delete('subscribe')
  unsubscribe(@Query('endpoint') endpoint: string) {
    return this.notificationsService.unsubscribe(endpoint);
  }
}
