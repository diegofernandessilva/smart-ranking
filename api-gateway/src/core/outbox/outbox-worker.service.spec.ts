import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OutboxWorkerService } from './outbox-worker.service';
import { AbstractOutboxRepository } from './outbox.repository';
import { AbstractQueueProvider } from '../rabbitmq/rabbitmq-queue.provider';
import { OutboxEventStatus } from './outbox-event.schema';
import { ConfigService } from '@nestjs/config';

function createMockEvent(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'event-id-1' },
    aggregateId: 'agg-1',
    aggregateType: 'Player',
    eventType: 'player.created',
    routingKey: 'admin.player.created',
    payload: { name: 'John' },
    status: OutboxEventStatus.PENDING,
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockConfigService(
  overrides: Record<string, unknown> = {},
): ConfigService {
  const defaults: Record<string, unknown> = {
    OUTBOX_BATCH_SIZE: 10,
    ...overrides,
  };
  return {
    get: vi.fn((key: string, defaultValue?: unknown) =>
      key in defaults ? defaults[key] : defaultValue,
    ),
  } as unknown as ConfigService;
}

describe('OutboxWorkerService', () => {
  let worker: OutboxWorkerService;
  let outboxRepo: AbstractOutboxRepository;
  let queueProvider: AbstractQueueProvider;
  let configService: ConfigService;

  beforeEach(() => {
    outboxRepo = {
      create: vi.fn(),
      findPending: vi.fn().mockResolvedValue([]),
      markPublished: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
      incrementAttempt: vi.fn().mockResolvedValue(undefined),
    } as unknown as AbstractOutboxRepository;

    queueProvider = {
      emit: vi.fn().mockResolvedValue(undefined),
      send: vi.fn(),
    } as unknown as AbstractQueueProvider;

    configService = createMockConfigService();

    worker = new OutboxWorkerService(outboxRepo, queueProvider, configService);
  });

  it('should publish pending events and mark as PUBLISHED', async () => {
    const event = createMockEvent();
    vi.mocked(outboxRepo.findPending).mockResolvedValue([event] as never);

    await worker.processPendingEvents();

    expect(outboxRepo.findPending).toHaveBeenCalledWith(10);
    expect(outboxRepo.incrementAttempt).toHaveBeenCalledWith('event-id-1');
    expect(queueProvider.emit).toHaveBeenCalledWith(
      'admin.player.created',
      { name: 'John' },
    );
    expect(outboxRepo.markPublished).toHaveBeenCalledWith('event-id-1');
  });

  it('should retry on failure and NOT mark as FAILED if under maxAttempts', async () => {
    const event = createMockEvent({ attempts: 0, maxAttempts: 3 });
    vi.mocked(outboxRepo.findPending).mockResolvedValue([event] as never);
    vi.mocked(queueProvider.emit).mockRejectedValue(new Error('Connection refused'));

    await worker.processPendingEvents();

    expect(outboxRepo.incrementAttempt).toHaveBeenCalledWith('event-id-1');
    expect(outboxRepo.markPublished).not.toHaveBeenCalled();
    expect(outboxRepo.markFailed).not.toHaveBeenCalled();
  });

  it('should mark as FAILED after reaching maxAttempts', async () => {
    const event = createMockEvent({ attempts: 2, maxAttempts: 3 });
    vi.mocked(outboxRepo.findPending).mockResolvedValue([event] as never);
    vi.mocked(queueProvider.emit).mockRejectedValue(new Error('Connection refused'));

    await worker.processPendingEvents();

    expect(outboxRepo.markFailed).toHaveBeenCalledWith(
      'event-id-1',
      'Connection refused',
    );
  });

  it('should process multiple events sequentially', async () => {
    const event1 = createMockEvent({
      _id: { toString: () => 'id-1' },
      routingKey: 'admin.player.created',
    });
    const event2 = createMockEvent({
      _id: { toString: () => 'id-2' },
      routingKey: 'admin.category.created',
    });
    vi.mocked(outboxRepo.findPending).mockResolvedValue([event1, event2] as never);

    await worker.processPendingEvents();

    expect(outboxRepo.markPublished).toHaveBeenCalledTimes(2);
    expect(outboxRepo.markPublished).toHaveBeenCalledWith('id-1');
    expect(outboxRepo.markPublished).toHaveBeenCalledWith('id-2');
  });

  it('should not process if already processing (reentrancy guard)', async () => {
    let resolveFirst: () => void;
    const firstCallPromise = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });

    vi.mocked(outboxRepo.findPending).mockImplementation(async () => {
      await firstCallPromise;
      return [];
    });

    const firstProcess = worker.processPendingEvents();
    const secondProcess = worker.processPendingEvents();

    resolveFirst!();
    await firstProcess;
    await secondProcess;

    expect(outboxRepo.findPending).toHaveBeenCalledTimes(1);
  });

  it('should handle errors from findPending gracefully', async () => {
    vi.mocked(outboxRepo.findPending).mockRejectedValue(new Error('DB connection error'));

    await expect(worker.processPendingEvents()).resolves.not.toThrow();
  });

  it('should use custom batch size from config', async () => {
    const customConfigService = createMockConfigService({
      OUTBOX_BATCH_SIZE: 25,
    });
    const customWorker = new OutboxWorkerService(
      outboxRepo,
      queueProvider,
      customConfigService,
    );

    await customWorker.processPendingEvents();

    expect(outboxRepo.findPending).toHaveBeenCalledWith(25);
  });
});
