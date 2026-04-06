import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MongooseRefreshTokenRepository } from './mongoose-refresh-token.repository';
import { RefreshTokenEntity } from '~/modules/auth/domain/entities/refresh-token.entity';

function createMockRefreshToken(): RefreshTokenEntity {
  return RefreshTokenEntity.create('token-id-123', {
    userId: 'user-id-123',
    tokenHash: 'abc123hash',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

function createMockDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'token-id-123' },
    userId: { toString: () => 'user-id-123' },
    tokenHash: 'abc123hash',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isRevoked: false,
    replacedByHash: undefined,
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

const mockModel = {
  create: vi.fn(),
  findOne: vi.fn(),
  updateOne: vi.fn(),
  updateMany: vi.fn(),
};

describe('MongooseRefreshTokenRepository', () => {
  let repository: MongooseRefreshTokenRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new MongooseRefreshTokenRepository(mockModel as never);
  });

  describe('create', () => {
    it('should create a refresh token document', async () => {
      const token = createMockRefreshToken();
      mockModel.create.mockResolvedValue(createMockDoc());

      await repository.create(token);

      expect(mockModel.create).toHaveBeenCalledTimes(1);
      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenHash: 'abc123hash',
          userId: 'user-id-123',
          isRevoked: false,
        }),
      );
    });
  });

  describe('findByTokenHash', () => {
    it('should return entity when found', async () => {
      mockModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(createMockDoc()),
      });

      const result = await repository.findByTokenHash('abc123hash');

      expect(result).toBeInstanceOf(RefreshTokenEntity);
      expect(result!.tokenHash).toBe('abc123hash');
      expect(result!.userId).toBe('user-id-123');
    });

    it('should return null when not found', async () => {
      mockModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      const result = await repository.findByTokenHash('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('revokeByTokenHash', () => {
    it('should set isRevoked to true', async () => {
      mockModel.updateOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      await repository.revokeByTokenHash('abc123hash');

      expect(mockModel.updateOne).toHaveBeenCalledWith(
        { tokenHash: 'abc123hash' },
        { isRevoked: true },
      );
    });
  });

  describe('revokeAllByUserId', () => {
    it('should revoke all non-revoked tokens for user', async () => {
      mockModel.updateMany.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ modifiedCount: 3 }),
      });

      await repository.revokeAllByUserId('user-id-123');

      expect(mockModel.updateMany).toHaveBeenCalledWith(
        { userId: 'user-id-123', isRevoked: false, deletedAt: null },
        { isRevoked: true },
      );
    });
  });
});
