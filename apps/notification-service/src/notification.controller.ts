import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { TOPICS, EventEnvelope } from '@poc/contracts';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern(TOPICS.ACTIVATION_EVENTS)
  async handleActivationEvents(@Payload() message: any) {
    const event: EventEnvelope = typeof message === 'string' ? JSON.parse(message) : message;
    await this.notificationService.handleActivationEvents(event);
  }
}