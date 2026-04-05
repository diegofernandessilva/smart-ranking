import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MongooseOutboxRepository } from './outbox.repository';
import { OutboxEventStatus } from './outbox-event.schema';

function createMockModel() {
  const mockDoc = {
    _id: 'generated-id',
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
  };

  const model = {
    create: vi.fn().mockResolvedValue(mockDoc),
    find: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([mockDoc]),
    updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
  };

  return { model, mockDoc };
}

describe('MongooseOutboxRepository', () => {
  let repository: MongooseOutboxRepository;
  let model: ReturnType<typeof createMockModel>['model'];

  beforeEach(() => {
    const mocks = createMockModel();
    model = mocks.model;
    repository = new MongooseOutboxRepository(model as never);
  });

  describe('create', () => {
    it('should create a PENDING outbox event', async () => {
      const input = {
        aggregateId: 'agg-1',
        aggregateType: 'Player',
        eventType: 'player.created',
        routingKey: 'admin.player.created',
        payload: { name: 'John' },
      };

      const result = await repository.create(input);

      expect(model.create).toHaveBeenCalledWith({
        ...input,
        status: OutboxEventStatus.PENDING,
        attempts: 0,
        maxAttempts: 3,
      });
      expect(result).toBeDefined();
      expect(result.aggregateId).toBe('agg-1');
    });
  });

  describe('findPending', () => {
    it('should find pending events sorted by createdAt, limited', async () => {
      const result = await repository.findPending(5);

      expect(model.find).toHaveBeenCalledWith({
        status: OutboxEventStatus.PENDING,
      });
      expect(model.sort).toHaveBeenCalledWith({ createdAt: 1 });
      expect(model.limit).toHaveBeenCalledWith(5);
      expect(result).toHaveLength(1);
    });
  });

  describe('markPublished', () => {
    it('should update status to PUBLISHED', async () => {
      await repository.markPublished('event-id');

      expect(model.updateOne).toHaveBeenCalledWith(
        { _id: 'event-id' },
        { status: OutboxEventStatus.PUBLISHED },
      );
    });
  });

  describe('markFailed', () => {
    it('should update status to FAILED with error message', async () => {
      await repository.markFailed('event-id', 'Connection refused');

      expect(model.updateOne).toHaveBeenCalledWith(
        { _id: 'event-id' },
        {
          status: OutboxEventStatus.FAILED,
          errorMessage: 'Connection refused',
        },
      );
    });
  });

  describe('incrementAttempt', () => {
    it('should increment attempts and set lastAttemptAt', async () => {
      await repository.incrementAttempt('event-id');

      expect(model.updateOne).toHaveBeenCalledWith(
        { _id: 'event-id' },
        expect.objectContaining({
          $inc: { attempts: 1 },
        }),
      );
    });
  });
});
