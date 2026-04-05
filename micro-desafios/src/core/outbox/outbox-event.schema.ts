import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type OutboxEventDocument = HydratedDocument<OutboxEvent>;

export enum OutboxEventStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true, collection: 'outbox_events' })
export class OutboxEvent {
  @Prop({ type: String, required: true })
  aggregateId!: string;

  @Prop({ type: String, required: true })
  aggregateType!: string;

  @Prop({ type: String, required: true })
  eventType!: string;

  @Prop({ type: String, required: true })
  routingKey!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  payload!: Record<string, unknown>;

  @Prop({
    type: String,
    enum: OutboxEventStatus,
    default: OutboxEventStatus.PENDING,
  })
  status!: OutboxEventStatus;

  @Prop({ type: Number, default: 0 })
  attempts!: number;

  @Prop({ type: Number, default: 3 })
  maxAttempts!: number;

  @Prop({ type: Date })
  lastAttemptAt?: Date;

  @Prop({ type: String })
  errorMessage?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const OutboxEventSchema = SchemaFactory.createForClass(OutboxEvent);

OutboxEventSchema.index({ status: 1, createdAt: 1 });
