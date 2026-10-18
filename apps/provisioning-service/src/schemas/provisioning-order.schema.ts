import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProvisioningOrderDocument = ProvisioningOrder & Document;

@Schema({ timestamps: true })
export class ProvisioningOrder {
  @Prop({ required: true, unique: true })
  activationId: string;

  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  planId: string;

  @Prop({ required: true, default: 'COMPLETED' })
  status: 'COMPLETED' | 'FAILED';

  @Prop()
  failureReason?: string;
}

export const ProvisioningOrderSchema = SchemaFactory.createForClass(ProvisioningOrder);