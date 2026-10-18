import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { BillingService } from './billing.service';
import { TOPICS, EventEnvelope } from '@poc/contracts';

@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // Escuchar cuando una activación se solicita
  @EventPattern(TOPICS.ACTIVATION_REQUESTED)
  async handleActivationRequested(@Payload() message: any) {
    const event: EventEnvelope = typeof message === 'string' ? JSON.parse(message) : message;
    await this.billingService.handleActivationRequested(event);
  }

  // Escuchar cuando una activación falla (para compensar)
  @EventPattern(TOPICS.ACTIVATION_EVENTS)
  async handleActivationEvents(@Payload() message: any) {
    const event: EventEnvelope = typeof message === 'string' ? JSON.parse(message) : message;
    if (event.eventType === 'ActivationFailed') {
      await this.billingService.handleActivationFailed(event);
    }
  }
}