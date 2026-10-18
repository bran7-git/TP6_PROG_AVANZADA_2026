import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientKafka } from '@nestjs/microservices';
import { Activation, ActivationDocument } from './schemas/activation.schema';
import { EventsGateway } from './events.gateway';
import { EventEnvelope, TOPICS } from '@poc/contracts';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ActivationService implements OnModuleInit {
  constructor(
    @InjectModel(Activation.name) private activationModel: Model<ActivationDocument>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async onModuleInit() {
    // Para patrones de eventos (Pub/Sub) con emit(), solo requerimos asegurar la conexión del cliente Kafka
    await this.kafkaClient.connect();
  }

  async createActivation(customerId: string, planId: string, simulateFailure: string) {
    const activationId = `act-${Date.now()}`;
    
    await this.activationModel.create({
      activationId,
      customerId,
      planId,
      status: 'PENDING',
      simulateFailure: simulateFailure || 'none',
      eventsHistory: [],
    });

    const event: EventEnvelope = {
      eventId: uuidv4(),
      eventType: 'ActivationRequested',
      version: 1,
      occurredAt: new Date().toISOString(),
      correlationId: activationId,
      customerId,
      source: 'activation-api',
      payload: {
        planId,
        channel: 'web',
        simulateFailure: simulateFailure || 'none',
      },
    };

    await this.recordAndEmitEvent(activationId, event);

    this.kafkaClient.emit(TOPICS.ACTIVATION_REQUESTED, {
      key: customerId,
      value: JSON.stringify(event),
    });

    return { activationId, status: 'PENDING' };
  }

  async getActivation(id: string) {
    return this.activationModel.findOne({ activationId: id }).exec();
  }

  async handleBillingResult(rawEvent: any) {
    const event: EventEnvelope = this.parseKafkaEvent(rawEvent);
    if (!event || !event.correlationId) return;

    const activation = await this.activationModel.findOne({ activationId: event.correlationId });
    if (!activation) return;

    await this.recordAndEmitEvent(event.correlationId, event);

    if (event.eventType === 'BillingAccountCreated') {
      activation.billingOk = true;
      await activation.save();
      await this.checkSagaCompletion(activation);
    } else if (event.eventType === 'BillingFailed') {
      await this.failSaga(activation, `Billing falló: ${event.payload?.reason || 'Error desconocido'}`);
    }
  }

  async handleProvisioningResult(rawEvent: any) {
    const event: EventEnvelope = this.parseKafkaEvent(rawEvent);
    if (!event || !event.correlationId) return;

    const activation = await this.activationModel.findOne({ activationId: event.correlationId });
    if (!activation) return;

    await this.recordAndEmitEvent(event.correlationId, event);

    if (event.eventType === 'ProvisioningCompleted') {
      activation.provisioningOk = true;
      await activation.save();
      await this.checkSagaCompletion(activation);
    } else if (event.eventType === 'ProvisioningFailed') {
      await this.failSaga(activation, `Provisioning falló: ${event.payload?.reason || 'Error desconocido'}`);
    }
  }

  private async checkSagaCompletion(activation: ActivationDocument) {
    if (activation.billingOk && activation.provisioningOk && activation.status === 'PENDING') {
      activation.status = 'ACTIVE';
      await activation.save();

      const event: EventEnvelope = {
        eventId: uuidv4(),
        eventType: 'ActivationCompleted',
        version: 1,
        occurredAt: new Date().toISOString(),
        correlationId: activation.activationId,
        customerId: activation.customerId,
        source: 'activation-api',
        payload: { status: 'ACTIVE', completedAt: new Date().toISOString() },
      };

      await this.recordAndEmitEvent(activation.activationId, event);
      this.kafkaClient.emit(TOPICS.ACTIVATION_EVENTS, {
        key: activation.customerId,
        value: JSON.stringify(event),
      });
    }
  }

  private async failSaga(activation: ActivationDocument, reason: string) {
    if (activation.status === 'FAILED') return;

    activation.status = 'FAILED';
    await activation.save();

    const event: EventEnvelope = {
      eventId: uuidv4(),
      eventType: 'ActivationFailed',
      version: 1,
      occurredAt: new Date().toISOString(),
      correlationId: activation.activationId,
      customerId: activation.customerId,
      source: 'activation-api',
      payload: { status: 'FAILED', failedAt: new Date().toISOString(), reason },
    };

    await this.recordAndEmitEvent(activation.activationId, event);
    this.kafkaClient.emit(TOPICS.ACTIVATION_EVENTS, {
      key: activation.customerId,
      value: JSON.stringify(event),
    });
  }

  private async recordAndEmitEvent(activationId: string, event: any) {
    await this.activationModel.updateOne(
      { activationId },
      { $push: { eventsHistory: event } },
    );
    // Emite el evento a través del gateway hacia Socket.io
    this.eventsGateway.emitEvent(activationId, event);
  }

  private parseKafkaEvent(rawEvent: any): EventEnvelope {
    const payload = rawEvent?.value ?? rawEvent;
    if (typeof payload === 'string') {
      try {
        return JSON.parse(payload);
      } catch {
        return payload as any;
      }
    }
    return payload;
  }
}