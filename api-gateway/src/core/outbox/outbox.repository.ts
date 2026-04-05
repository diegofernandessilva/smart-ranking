import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  OutboxEvent,
  OutboxEventDocument,
  OutboxEventStatus,
} from './outbox-event.schema';

export abstract class AbstractOutboxRepository {
  abstract create(event: {
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    routingKey: string;
    payload: Record<string, unknown>;
  }): Promise<OutboxEventDocument>;

  abstract findPending(limit: number): Promise<OutboxEventDocument[]>;
  abstract markPublished(id: string): Promise<void>;
  abstract markFailed(id: string, errorMessage: string): Promise<void>;
  abstract incrementAttempt(id: string): Promise<void>;
}

@Injectable()
export class MongooseOutboxRepository extends AbstractOutboxRepository {
  constructor(
    @InjectModel(OutboxEvent.name)
    private readonly outboxModel: Model<OutboxEventDocument>,
  ) {
    super();
  }

  async create(event: {
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    routingKey: string;
    payload: Record<string, unknown>;
  }): Promise<OutboxEventDocument> {
    return this.outboxModel.create({
      ...event,
      status: OutboxEventStatus.PENDING,
      attempts: 0,
      maxAttempts: 3,
    });
  }

  async findPending(limit: number): Promise<OutboxEventDocument[]> {
    return this.outboxModel
      .find({ status: OutboxEventStatus.PENDING })
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();
  }

  async markPublished(id: string): Promise<void> {
    await this.outboxModel.updateOne(
      { _id: id },
      { status: OutboxEventStatus.PUBLISHED },
    );
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    await this.outboxModel.updateOne(
      { _id: id },
      {
        status: OutboxEventStatus.FAILED,
        errorMessage,
      },
    );
  }

  async incrementAttempt(id: string): Promise<void> {
    await this.outboxModel.updateOne(
      { _id: id },
      {
        $inc: { attempts: 1 },
        lastAttemptAt: new Date(),
      },
    );
  }
}
