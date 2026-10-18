import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientKafka } from '@nestjs/microservices';
import { ProvisioningOrder, ProvisioningOrderDocument } from './schemas/provisioning-order.schema';
import { ProcessedEvent, ProcessedEventDocument } from './schemas/processed-event.schema';
import { EventEnvelope, TOPICS } from '@poc/contracts';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProvisioningService implements OnModuleInit {
  constructor(
    @InjectModel(ProvisioningOrder.name) private provisioningModel: Model<ProvisioningOrderDocument>,
    @InjectModel(ProcessedEvent.name) private processedEventModel: Model<ProcessedEventDocument>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async handleActivationRequested(event: EventEnvelope) {
    // Control de Idempotencia
    const isDuplicate = await this.isEventProcessed(event.eventId);
    if (isDuplicate) {
      console.log(`[Provisioning] Evento duplicado ignorado: ${event.eventId}`);
      return;
    }

    const { correlationId, customerId, payload } = event;
    const simulateFailure = payload?.simulateFailure;

    await this.markEventProcessed(event.eventId, correlationId);

    // Simulación de fallo en aprovisionamiento (RF-06)
    if (simulateFailure === 'provisioning') {
      const orderId = `ord-${Date.now()}`;
      await this.provisioningModel.create({
        activationId: correlationId,
        orderId,
        customerId,
        planId: payload?.planId || 'DEFAULT',
        status: 'FAILED',
        failureReason: 'Simulación de fallo en red de aprovisionamiento',
      });

      const failedEvent: EventEnvelope = {
        eventId: uuidv4(),
        eventType: 'ProvisioningFailed',
        version: 1,
        occurredAt: new Date().toISOString(),
        correlationId,
        customerId,
        source: 'provisioning-service',
        payload: { reason: 'Simulación de fallo en red de aprovisionamiento' },
      };

      this.kafkaClient.emit(TOPICS.PROVISIONING_EVENTS, {
        key: customerId,
        value: JSON.stringify(failedEvent),
      });
      return;
    }

    // Camino Feliz
    const orderId = `ord-${Date.now()}`;
    await this.provisioningModel.create({
      activationId: correlationId,
      orderId,
      customerId,
      planId: payload?.planId || 'DEFAULT',
      status: 'COMPLETED',
    });

    const completedEvent: EventEnvelope = {
      eventId: uuidv4(),
      eventType: 'ProvisioningCompleted',
      version: 1,
      occurredAt: new Date().toISOString(),
      correlationId,
      customerId,
      source: 'provisioning-service',
      payload: { orderId, planId: payload?.planId },
    };

    this.kafkaClient.emit(TOPICS.PROVISIONING_EVENTS, {
      key: customerId,
      value: JSON.stringify(completedEvent),
    });
  }

  private async isEventProcessed(eventId: string): Promise<boolean> {
    const found = await this.processedEventModel.findOne({ eventId });
    return !!found;
  }

  private async markEventProcessed(eventId: string, correlationId: string) {
    try {
      await this.processedEventModel.create({ eventId, correlationId });
    } catch (e) {
      // Ignorar si por condición de carrera ya existía
    }
  }
}