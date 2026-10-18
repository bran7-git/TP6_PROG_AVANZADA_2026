import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BillingAccountDocument = BillingAccount & Document;

@Schema({ timestamps: true })
export class BillingAccount {
  @Prop({ required: true, unique: true })
  activationId: string;

  @Prop({ required: true })
  accountId: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'CREATED' })
  status: 'CREATED' | 'CANCELLED';

  @Prop()
  cancellationReason?: string;
}

export const BillingAccountSchema = SchemaFactory.createForClass(BillingAccount);