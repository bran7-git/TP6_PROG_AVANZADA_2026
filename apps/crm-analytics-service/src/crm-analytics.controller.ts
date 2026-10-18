import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CrmAnalyticsService } from './crm-analytics.service';
import { TOPICS, EventEnvelope } from '@poc/contracts';

@Controller()
export class CrmAnalyticsController {
  constructor(private readonly analyticsService: CrmAnalyticsService) {}

  @EventPattern(TOPICS.ACTIVATION_REQUESTED)
  @EventPattern(TOPICS.BILLING_EVENTS)
  @EventPattern(TOPICS.PROVISIONING_EVENTS)
  @EventPattern(TOPICS.ACTIVATION_EVENTS)
  async handleAllEvents(@Payload() message: any) {
    const event: EventEnvelope = typeof message === 'string' ? JSON.parse(message) : message;
    await this.analyticsService.handleEvent(event);
  }
}