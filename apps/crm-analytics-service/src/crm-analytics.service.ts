import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventLog, EventLogDocument } from './schemas/event-log.schema';
import { EventEnvelope } from '@poc/contracts';

@Injectable()
export class CrmAnalyticsService {
  constructor(
    @InjectModel(EventLog.name) private eventLogModel: Model<EventLogDocument>,
  ) {}

  async handleEvent(event: EventEnvelope) {
    try {
      await this.eventLogModel.create({
        eventId: event.eventId,
        eventType: event.eventType,
        correlationId: event.correlationId,
        customerId: event.customerId,
        source: event.source,
        payload: event.payload,
        occurredAt: new Date(event.occurredAt),
      });
      console.log(`📊 [CRM Analytics] Evento registrado: ${event.eventType} (${event.correlationId})`);
    } catch (error: any) {
      if (error.code === 11000) {
        console.log(`📊 [CRM Analytics] Evento duplicado ignorado: ${event.eventId}`);
      } else {
        console.error(`❌ [CRM Analytics] Error al guardar evento:`, error.message);
      }
    }
  }
}