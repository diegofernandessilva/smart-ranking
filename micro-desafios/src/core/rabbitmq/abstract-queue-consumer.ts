import { Logger } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';

const MONGO_DUPLICATE_KEY_CODE = 11000;

export abstract class AbstractQueueConsumer<T> {
  protected readonly logger: Logger;

  constructor(consumerName: string) {
    this.logger = new Logger(consumerName);
  }

  protected abstract handle(data: T): Promise<void>;

  async safeHandle(data: T, context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.handle(data);
      channel.ack(originalMsg);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        this.logger.warn(
          `Duplicate key (E11000) — ACKing message as already processed`,
        );
        channel.ack(originalMsg);
        return;
      }

      this.logger.error(
        `Error processing message — NACKing for requeue`,
        error instanceof Error ? error.stack : String(error),
      );
      channel.nack(originalMsg, false, true);
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      if (err['code'] === MONGO_DUPLICATE_KEY_CODE) return true;
      if (
        typeof err['message'] === 'string' &&
        err['message'].includes('E11000')
      )
        return true;
    }
    return false;
  }
}
