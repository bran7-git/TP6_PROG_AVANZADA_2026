import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProcessedEventDocument = ProcessedEvent & Document;

@Schema({ timestamps: true })
export class ProcessedEvent {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true })
  correlationId: string;

  // TTL index: los documentos expiran a los 7 días
  @Prop({ default: Date.now, expires: '7d' })
  createdAt: Date;
}

export const ProcessedEventSchema = SchemaFactory.createForClass(ProcessedEvent);