import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MongooseUserRepository } from './mongoose-user.repository';
import { UserEntity } from '~/modules/auth/domain/entities/user.entity';
import { Email } from '~/modules/auth/domain/value-objects/email.vo';
import { Password } from '~/modules/auth/domain/value-objects/password.vo';
import { PhoneNumber } from '~/modules/auth/domain/value-objects/phone-number.vo';

function createMockUser(): UserEntity {
  return UserEntity.create('user-id-123', {
    email: new Email('john@example.com'),
    password: Password.fromHash('$2b$12$hashedpassword'),
    name: 'John Doe',
    phoneNumber: new PhoneNumber('11999999999'),
  });
}

function createMockDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'user-id-123' },
    email: 'john@example.com',
    password: '$2b$12$hashedpassword',
    name: 'John Doe',
    phoneNumber: '11999999999',
    role: 'PLAYER',
    isActive: true,
    failedLoginAttempts: 0,
    lockedUntil: undefined,
    passwordResetToken: undefined,
    passwordResetExpires: undefined,
    lastPasswordChange: undefined,
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

const mockModel = {
  create: vi.fn(),
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  updateOne: vi.fn(),
};

describe('MongooseUserRepository', () => {
  let repository: MongooseUserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new MongooseUserRepository(mockModel as never);
  });

  describe('create', () => {
    it('should create a user and return entity', async () => {
      const user = createMockUser();
      mockModel.create.mockResolvedValue(createMockDoc());

      const result = await repository.create(user);

      expect(result).toBeInstanceOf(UserEntity);
      expect(result.email.value).toBe('john@example.com');
      expect(mockModel.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByEmail', () => {
    it('should return entity when found', async () => {
      mockModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(createMockDoc()),
      });

      const result = await repository.findByEmail('john@example.com');

      expect(result).toBeInstanceOf(UserEntity);
      expect(result!.email.value).toBe('john@example.com');
      expect(mockModel.findOne).toHaveBeenCalledWith({
        email: 'john@example.com',
        deletedAt: null,
      });
    });

    it('should return null when not found', async () => {
      mockModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return entity when found', async () => {
      mockModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(createMockDoc()),
      });

      const result = await repository.findById('user-id-123');

      expect(result).toBeInstanceOf(UserEntity);
      expect(mockModel.findOne).toHaveBeenCalledWith({
        _id: 'user-id-123',
        deletedAt: null,
      });
    });

    it('should return null when not found', async () => {
      mockModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return entity', async () => {
      mockModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(
          createMockDoc({ failedLoginAttempts: 3 }),
        ),
      });

      const result = await repository.update('user-id-123', {
        failedLoginAttempts: 3,
      });

      expect(result).toBeInstanceOf(UserEntity);
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'user-id-123', deletedAt: null },
        { failedLoginAttempts: 3 },
        { new: true },
      );
    });

    it('should throw if user not found', async () => {
      mockModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(
        repository.update('nonexistent', { failedLoginAttempts: 0 }),
      ).rejects.toThrow('User with id nonexistent not found');
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt on the document', async () => {
      mockModel.updateOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      await repository.softDelete('user-id-123');

      expect(mockModel.updateOne).toHaveBeenCalledWith(
        { _id: 'user-id-123', deletedAt: null },
        { deletedAt: expect.any(Date) },
      );
    });
  });
});
