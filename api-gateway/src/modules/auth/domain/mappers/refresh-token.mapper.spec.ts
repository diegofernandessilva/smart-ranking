import { describe, it, expect } from 'vitest';
import { RefreshTokenMapper } from './refresh-token.mapper';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { IRefreshTokenPersistentData } from '../entities/refresh-token.interface';

const now = new Date('2026-01-01T00:00:00Z');
const expiresAt = new Date('2026-01-08T00:00:00Z');

const makeEntity = (): RefreshTokenEntity =>
  new RefreshTokenEntity(
    'token-1',
    {
      userId: 'user-1',
      tokenHash: 'hash-abc123',
      expiresAt,
      isRevoked: false,
      replacedByHash: undefined,
    },
    now,
    now,
  );

const makePersistentData = (): IRefreshTokenPersistentData => ({
  _id: 'token-1',
  userId: 'user-1',
  tokenHash: 'hash-abc123',
  expiresAt,
  isRevoked: false,
  replacedByHash: undefined,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
});

describe('RefreshTokenMapper', () => {
  describe('toPersistentData', () => {
    it('should convert entity to persistent data', () => {
      const entity = makeEntity();
      const data = RefreshTokenMapper.toPersistentData(entity);

      expect(data._id).toBe('token-1');
      expect(data.userId).toBe('user-1');
      expect(data.tokenHash).toBe('hash-abc123');
      expect(data.expiresAt).toBe(expiresAt);
      expect(data.isRevoked).toBe(false);
      expect(data.replacedByHash).toBeUndefined();
      expect(data.deletedAt).toBeNull();
      expect(data.createdAt).toBe(now);
      expect(data.updatedAt).toBe(now);
    });

    it('should include replacedByHash when set', () => {
      const entity = makeEntity();
      entity.replaceWith('new-hash-xyz');
      const data = RefreshTokenMapper.toPersistentData(entity);

      expect(data.isRevoked).toBe(true);
      expect(data.replacedByHash).toBe('new-hash-xyz');
    });
  });

  describe('toEntity', () => {
    it('should convert persistent data to entity', () => {
      const data = makePersistentData();
      const entity = RefreshTokenMapper.toEntity(data);

      expect(entity.id).toBe('token-1');
      expect(entity.userId).toBe('user-1');
      expect(entity.tokenHash).toBe('hash-abc123');
      expect(entity.expiresAt).toBe(expiresAt);
      expect(entity.isRevoked).toBe(false);
      expect(entity.replacedByHash).toBeUndefined();
      expect(entity.deletedAt).toBeNull();
    });

    it('should restore a revoked token correctly', () => {
      const data: IRefreshTokenPersistentData = {
        ...makePersistentData(),
        isRevoked: true,
        replacedByHash: 'replacement-hash',
      };
      const entity = RefreshTokenMapper.toEntity(data);

      expect(entity.isRevoked).toBe(true);
      expect(entity.replacedByHash).toBe('replacement-hash');
    });
  });

  describe('roundtrip', () => {
    it('should preserve data through entity → persistent → entity', () => {
      const original = makeEntity();
      const data = RefreshTokenMapper.toPersistentData(original);
      const restored = RefreshTokenMapper.toEntity(data);

      expect(restored.id).toBe(original.id);
      expect(restored.userId).toBe(original.userId);
      expect(restored.tokenHash).toBe(original.tokenHash);
      expect(restored.expiresAt).toBe(original.expiresAt);
      expect(restored.isRevoked).toBe(original.isRevoked);
      expect(restored.replacedByHash).toBe(
        original.replacedByHash,
      );
    });
  });
});
