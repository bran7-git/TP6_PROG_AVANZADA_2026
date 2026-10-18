import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientKafka } from '@nestjs/microservices';
import { BillingAccount, BillingAccountDocument } from './schemas/billing-account.schema';
import { ProcessedEvent, ProcessedEventDocument } from './schemas/processed-event.schema';
import { EventEnvelope, TOPICS } from '@poc/contracts';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BillingService implements OnModuleInit {
  constructor(
    @InjectModel(BillingAccount.name) private billingModel: Model<BillingAccountDocument>,
    @InjectModel(ProcessedEvent.name) private processedEventModel: Model<ProcessedEventDocument>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  // 1. Manejar Solicitud de Activación (ActivationRequested)
  async handleActivationRequested(event: EventEnvelope) {
    // Control de Idempotencia
    const isDuplicate = await this.isEventProcessed(event.eventId);
    if (isDuplicate) {
      console.log(`[Billing] Evento duplicado ignorado: ${event.eventId}`);
      return;
    }

    const { correlationId, customerId, payload } = event;
    const simulateFailure = payload?.simulateFailure;

    // Registrar evento como procesado
    await this.markEventProcessed(event.eventId, correlationId);

    // Si se forzó el fallo en billing (RF-06)
    if (simulateFailure === 'billing') {
      const failedEvent: EventEnvelope = {
        eventId: uuidv4(),
        eventType: 'BillingFailed',
        version: 1,
        occurredAt: new Date().toISOString(),
        correlationId,
        customerId,
        source: 'billing-service',
        payload: { reason: 'Simulación de fallo en facturación solicitada' },
      };

      this.kafkaClient.emit(TOPICS.BILLING_EVENTS, {
        key: customerId,
        value: JSON.stringify(failedEvent),
      });
      return;
    }

    // Crear cuenta de facturación simulada (Camino feliz)
    const accountId = `acc-${Date.now()}`;
    await this.billingModel.create({
      activationId: correlationId,
      accountId,
      customerId,
      amount: 1500,
      status: 'CREATED',
    });

    const successEvent: EventEnvelope = {
      eventId: uuidv4(),
      eventType: 'BillingAccountCreated',
      version: 1,
      occurredAt: new Date().toISOString(),
      correlationId,
      customerId,
      source: 'billing-service',
      payload: { accountId, amount: 1500 },
    };

    this.kafkaClient.emit(TOPICS.BILLING_EVENTS, {
      key: customerId,
      value: JSON.stringify(successEvent),
    });
  }

  // 2. Manejar Compensación (ActivationFailed)
  async handleActivationFailed(event: EventEnvelope) {
    const isDuplicate = await this.isEventProcessed(event.eventId);
    if (isDuplicate) return;

    const { correlationId, customerId, payload } = event;
    await this.markEventProcessed(event.eventId, correlationId);

    const account = await this.billingModel.findOne({ activationId: correlationId });
    if (account && account.status === 'CREATED') {
      account.status = 'CANCELLED';
      account.cancellationReason = payload?.reason || 'Saga de activación fallida';
      await account.save();

      const cancelledEvent: EventEnvelope = {
        eventId: uuidv4(),
        eventType: 'BillingAccountCancelled',
        version: 1,
        occurredAt: new Date().toISOString(),
        correlationId,
        customerId,
        source: 'billing-service',
        payload: { accountId: account.accountId, reason: account.cancellationReason },
      };

      this.kafkaClient.emit(TOPICS.BILLING_EVENTS, {
        key: customerId,
        value: JSON.stringify(cancelledEvent),
      });
    }
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