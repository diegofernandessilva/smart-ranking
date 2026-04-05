import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { AbstractOutboxRepository } from './outbox.repository';
import { AbstractQueueProvider } from '../rabbitmq/rabbitmq-queue.provider';
import { OutboxEventDocument } from './outbox-event.schema';

const DEFAULT_BATCH_SIZE = 10;

@Injectable()
export class OutboxWorkerService {
  private readonly logger = new Logger(OutboxWorkerService.name);
  private readonly batchSize = DEFAULT_BATCH_SIZE;
  private processing = false;

  constructor(
    private readonly outboxRepository: AbstractOutboxRepository,
    private readonly queueProvider: AbstractQueueProvider,
  ) {}

  @Interval(5000)
  async processPendingEvents(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const events = await this.outboxRepository.findPending(this.batchSize);

      for (const event of events) {
        await this.processEvent(event);
      }
    } catch (error) {
      this.logger.error(
        'Error fetching pending outbox events',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.processing = false;
    }
  }

  private async processEvent(event: OutboxEventDocument): Promise<void> {
    const eventId = event._id.toString();

    try {
      await this.outboxRepository.incrementAttempt(eventId);
      await this.queueProvider.emit(event.routingKey, event.payload);
      await this.outboxRepository.markPublished(eventId);

      this.logger.debug(
        `Outbox event published: ${event.eventType} [${eventId}]`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const newAttempts = event.attempts + 1;

      if (newAttempts >= event.maxAttempts) {
        await this.outboxRepository.markFailed(eventId, errorMessage);
        this.logger.error(
          `Outbox event FAILED after ${newAttempts} attempts: ${event.eventType} [${eventId}] — ${errorMessage}`,
        );
      } else {
        this.logger.warn(
          `Outbox event retry ${newAttempts}/${event.maxAttempts}: ${event.eventType} [${eventId}] — ${errorMessage}`,
        );
      }
    }
  }
}
