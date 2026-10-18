import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ActivationService } from './activation.service';
import { TOPICS, EventEnvelope } from '@poc/contracts';

@Controller('activations')
export class ActivationController {
  constructor(private readonly activationService: ActivationService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createActivation(
    @Body() body: { customerId: string; planId: string; simulateFailure?: string },
  ) {
    const customerId = body?.customerId || 'CUST-1001';
    const planId = body?.planId || 'PLAN-FIBRA-300';
    const simulateFailure = body?.simulateFailure || 'none';

    return this.activationService.createActivation(
      customerId,
      planId,
      simulateFailure,
    );
  }

  @Get(':id')
  async getActivation(@Param('id') id: string) {
    return this.activationService.getActivation(id);
  }

  @EventPattern(TOPICS.BILLING_EVENTS)
  async handleBillingEvents(@Payload() message: any) {
    const rawData = message?.value ?? message;
    const event: EventEnvelope = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    await this.activationService.handleBillingResult(event);
  }

  @EventPattern(TOPICS.PROVISIONING_EVENTS)
  async handleProvisioningEvents(@Payload() message: any) {
    const rawData = message?.value ?? message;
    const event: EventEnvelope = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    await this.activationService.handleProvisioningResult(event);
  }
}