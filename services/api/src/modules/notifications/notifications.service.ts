import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import * as webPush from 'web-push';
import { PushSubscription } from './entities/push-subscription.entity';
import { NotificationLog, NotificationStatus } from './entities/notification-log.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { ORDER_READY, OrderReadyEvent } from '../kitchen/kitchen.events';
import { DELIVERY_STATUS_UPDATED, DeliveryStatusUpdatedEvent } from '../deliveries/deliveries.events';
import { DeliveryStatus } from '../../common/enums/payment.enum';

// Which delivery statuses are actually worth waking a customer's phone for -
// "assigned" is a dispatcher-side event the customer doesn't need to know about.
const NOTIFIABLE_DELIVERY_STATUSES = new Set([DeliveryStatus.PICKED_UP, DeliveryStatus.DELIVERED]);

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private publicKey = '';

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subscriptions: Repository<PushSubscription>,
    @InjectRepository(NotificationLog)
    private readonly logs: Repository<NotificationLog>,
    private readonly config: ConfigService,
  ) {}

  // Dev convenience: if no VAPID keys are configured, generate an ephemeral
  // pair at boot so push still works locally without setup - logged loudly
  // since a real deployment needs a fixed pair (subscriptions survive
  // restarts; the keys that signed them need to as well).
  onModuleInit(): void {
    let publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    let privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT') || 'mailto:admin@example.com';

    if (!publicKey || !privateKey) {
      const generated = webPush.generateVAPIDKeys();
      publicKey = generated.publicKey;
      privateKey = generated.privateKey;
      this.logger.warn(
        'No VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY set - generated an ephemeral pair for this run. ' +
          'Existing push subscriptions will stop working on restart; set fixed keys in .env for anything beyond local dev.',
      );
    }

    this.publicKey = publicKey;
    webPush.setVapidDetails(subject, publicKey, privateKey);
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  async subscribe(dto: SubscribeDto): Promise<void> {
    const existing = await this.subscriptions.findOne({ where: { endpoint: dto.endpoint } });
    if (existing) {
      existing.orderId = dto.orderId;
      existing.p256dh = dto.keys.p256dh;
      existing.auth = dto.keys.auth;
      await this.subscriptions.save(existing);
      return;
    }
    await this.subscriptions.save(
      this.subscriptions.create({ orderId: dto.orderId, endpoint: dto.endpoint, p256dh: dto.keys.p256dh, auth: dto.keys.auth }),
    );
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.subscriptions.delete({ endpoint });
  }

  @OnEvent(ORDER_READY)
  async handleOrderReady(event: OrderReadyEvent): Promise<void> {
    await this.sendToOrder(event.orderId, 'order_ready', {
      title: 'Your order is ready!',
      body: 'Head to the counter, or your table if you ordered by QR.',
    });
  }

  @OnEvent(DELIVERY_STATUS_UPDATED)
  async handleDeliveryStatusUpdated(event: DeliveryStatusUpdatedEvent): Promise<void> {
    if (!NOTIFIABLE_DELIVERY_STATUSES.has(event.status)) return;
    const copy =
      event.status === DeliveryStatus.PICKED_UP
        ? { title: 'Your order is on its way!', body: 'A driver has picked it up.' }
        : { title: 'Delivered!', body: 'Enjoy your meal.' };
    await this.sendToOrder(event.orderId, `delivery_${event.status}`, copy);
  }

  // Best-effort, additive to the existing WebSocket broadcast - never
  // throws into the caller's event-handling flow, and a send failure is
  // just logged, not retried (see the entity's own doc comment for why).
  private async sendToOrder(orderId: string, eventName: string, payload: { title: string; body: string }): Promise<void> {
    const subs = await this.subscriptions.find({ where: { orderId } });
    for (const sub of subs) {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
        await this.logs.save(this.logs.create({ subscriptionId: sub.id, orderId, event: eventName, status: NotificationStatus.SENT }));
      } catch (err) {
        await this.logs.save(
          this.logs.create({
            subscriptionId: sub.id,
            orderId,
            event: eventName,
            status: NotificationStatus.FAILED,
            errorMessage: err instanceof Error ? err.message : String(err),
          }),
        );
        // A dead subscription (410 Gone / 404) will never succeed again - remove it.
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await this.subscriptions.delete({ id: sub.id });
        }
      }
    }
  }
}
