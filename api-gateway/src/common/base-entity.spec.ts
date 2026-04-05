import { describe, it, expect, vi } from 'vitest';
import { BaseEntity } from './base-entity';

class TestEntity extends BaseEntity {
  constructor(
    id: string,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null = null,
  ) {
    super(id, createdAt, updatedAt, deletedAt);
  }
}

describe('BaseEntity', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('should create an entity with required fields', () => {
    const entity = new TestEntity('123', now, now);

    expect(entity.id).toBe('123');
    expect(entity.createdAt).toBe(now);
    expect(entity.updatedAt).toBe(now);
    expect(entity.deletedAt).toBeNull();
    expect(entity.isDeleted).toBe(false);
  });

  it('should create an entity with deletedAt set', () => {
    const entity = new TestEntity('123', now, now, now);

    expect(entity.deletedAt).toBe(now);
    expect(entity.isDeleted).toBe(true);
  });

  it('should mark entity as deleted', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

    const entity = new TestEntity('123', now, now);
    expect(entity.isDeleted).toBe(false);

    entity.markAsDeleted();

    expect(entity.isDeleted).toBe(true);
    expect(entity.deletedAt).toEqual(new Date('2026-06-15T12:00:00Z'));

    vi.useRealTimers();
  });

  it('should restore a deleted entity', () => {
    const entity = new TestEntity('123', now, now, now);
    expect(entity.isDeleted).toBe(true);

    entity.restore();

    expect(entity.isDeleted).toBe(false);
    expect(entity.deletedAt).toBeNull();
  });
});
