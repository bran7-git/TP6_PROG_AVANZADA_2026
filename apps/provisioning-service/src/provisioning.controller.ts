import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ProvisioningService } from './provisioning.service';
import { TOPICS, EventEnvelope } from '@poc/contracts';

@Controller()
export class ProvisioningController {
  constructor(private readonly provisioningService: ProvisioningService) {}

  @EventPattern(TOPICS.ACTIVATION_REQUESTED)
  async handleActivationRequested(@Payload() message: any) {
    const event: EventEnvelope = typeof message === 'string' ? JSON.parse(message) : message;
    await this.provisioningService.handleActivationRequested(event);
  }
}