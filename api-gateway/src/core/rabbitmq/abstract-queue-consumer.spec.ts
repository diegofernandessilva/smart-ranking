import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RmqContext } from '@nestjs/microservices';
import { AbstractQueueConsumer } from './abstract-queue-consumer';

interface TestPayload {
  id: string;
  name: string;
}

class TestConsumer extends AbstractQueueConsumer<TestPayload> {
  public handleFn: (data: TestPayload) => Promise<void> = vi.fn();

  constructor() {
    super('TestConsumer');
  }

  protected async handle(data: TestPayload): Promise<void> {
    return this.handleFn(data);
  }
}

function createMockContext() {
  const ack = vi.fn();
  const nack = vi.fn();
  const channel = { ack, nack };
  const originalMsg = { content: Buffer.from('{}') };

  const context = {
    getChannelRef: () => channel,
    getMessage: () => originalMsg,
  } as unknown as RmqContext;

  return { context, ack, nack, originalMsg };
}

describe('AbstractQueueConsumer', () => {
  let consumer: TestConsumer;

  beforeEach(() => {
    consumer = new TestConsumer();
  });

  it('should ACK message on successful handling', async () => {
    consumer.handleFn = vi.fn().mockResolvedValue(undefined);
    const { context, ack, nack } = createMockContext();

    await consumer.safeHandle({ id: '1', name: 'Test' }, context);

    expect(consumer.handleFn).toHaveBeenCalledWith({ id: '1', name: 'Test' });
    expect(ack).toHaveBeenCalledTimes(1);
    expect(nack).not.toHaveBeenCalled();
  });

  it('should ACK on E11000 duplicate key error (code property)', async () => {
    const dupError = new Error('E11000 duplicate key error');
    (dupError as unknown as Record<string, unknown>)['code'] = 11000;
    consumer.handleFn = vi.fn().mockRejectedValue(dupError);
    const { context, ack, nack } = createMockContext();

    await consumer.safeHandle({ id: '1', name: 'Test' }, context);

    expect(ack).toHaveBeenCalledTimes(1);
    expect(nack).not.toHaveBeenCalled();
  });

  it('should ACK on E11000 duplicate key error (message string)', async () => {
    const dupError = new Error(
      'E11000 duplicate key error collection: db.players index: email_1',
    );
    consumer.handleFn = vi.fn().mockRejectedValue(dupError);
    const { context, ack, nack } = createMockContext();

    await consumer.safeHandle({ id: '1', name: 'Test' }, context);

    expect(ack).toHaveBeenCalledTimes(1);
    expect(nack).not.toHaveBeenCalled();
  });

  it('should NACK with requeue on non-duplicate errors', async () => {
    consumer.handleFn = vi
      .fn()
      .mockRejectedValue(new Error('Database connection failed'));
    const { context, ack, nack, originalMsg } = createMockContext();

    await consumer.safeHandle({ id: '1', name: 'Test' }, context);

    expect(ack).not.toHaveBeenCalled();
    expect(nack).toHaveBeenCalledWith(originalMsg, false, true);
  });

  it('should handle non-Error thrown values', async () => {
    consumer.handleFn = vi.fn().mockRejectedValue('string error');
    const { context, nack } = createMockContext();

    await consumer.safeHandle({ id: '1', name: 'Test' }, context);

    expect(nack).toHaveBeenCalledTimes(1);
  });
});
