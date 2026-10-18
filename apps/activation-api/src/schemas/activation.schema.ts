import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ActivationDocument = Activation & Document;

@Schema({ timestamps: true })
export class Activation {
  @Prop({ required: true, unique: true })
  activationId: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  planId: string;

  @Prop({ required: true, default: 'PENDING' })
  status: 'PENDING' | 'ACTIVE' | 'FAILED';

  @Prop({ required: true, default: 'none' })
  simulateFailure: string;

  @Prop({ type: Array, default: [] })
  eventsHistory: any[];

  @Prop({ default: false })
  billingOk: boolean;

  @Prop({ default: false })
  provisioningOk: boolean;
}

export const ActivationSchema = SchemaFactory.createForClass(Activation);