import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventLogDocument = EventLog & Document;

@Schema({ timestamps: true })
export class EventLog {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true })
  correlationId: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  source: string;

  @Prop({ type: Object })
  payload: Record<string, any>;

  @Prop({ required: true })
  occurredAt: Date;
}

export const EventLogSchema = SchemaFactory.createForClass(EventLog);