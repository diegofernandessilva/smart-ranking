import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ChangePasswordUseCase } from './change-password.use-case';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { AbstractRefreshTokenRepository } from '~/modules/auth/application/gateways/repositories/abstract-refresh-token.repository';
import { UserEntity } from '~/modules/auth/domain/entities/user.entity';
import { Email } from '~/modules/auth/domain/value-objects/email.vo';
import { Password } from '~/modules/auth/domain/value-objects/password.vo';
import { PhoneNumber } from '~/modules/auth/domain/value-objects/phone-number.vo';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn().mockResolvedValue('$2b$12$newhashedpassword'),
}));

const mockUserRepository: Record<keyof AbstractUserRepository, ReturnType<typeof vi.fn>> = {
  create: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
  findByResetToken: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
};

const mockRefreshTokenRepository: Record<keyof AbstractRefreshTokenRepository, ReturnType<typeof vi.fn>> = {
  create: vi.fn(),
  findByTokenHash: vi.fn(),
  revokeByTokenHash: vi.fn(),
  revokeAllByUserId: vi.fn(),
};

function createMockUser(): UserEntity {
  return UserEntity.create('user-id-123', {
    email: new Email('john@example.com'),
    password: Password.fromHash('$2b$12$hashedpassword'),
    name: 'John Doe',
    phoneNumber: new PhoneNumber('11999999999'),
  });
}

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let bcryptCompare: ReturnType<typeof vi.fn>;
  let bcryptHash: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const bcrypt = await import('bcrypt');
    bcryptCompare = vi.mocked(bcrypt.compare);
    bcryptHash = vi.mocked(bcrypt.hash);

    useCase = new ChangePasswordUseCase(
      mockUserRepository as unknown as AbstractUserRepository,
      mockRefreshTokenRepository as unknown as AbstractRefreshTokenRepository,
    );
  });

  it('should change password successfully', async () => {
    const user = createMockUser();
    mockUserRepository.findById.mockResolvedValue(user);
    bcryptCompare.mockResolvedValueOnce(true); // current password valid
    bcryptCompare.mockResolvedValueOnce(false); // new != current
    bcryptHash.mockResolvedValue('$2b$12$newhashedpassword');
    mockUserRepository.update.mockResolvedValue(user);
    mockRefreshTokenRepository.revokeAllByUserId.mockResolvedValue(undefined);

    await useCase.execute({
      userId: 'user-id-123',
      currentPassword: 'OldStr0ng!Pass',
      newPassword: 'NewStr0ng!Pass',
    });

    expect(mockUserRepository.update).toHaveBeenCalledWith(
      'user-id-123',
      expect.objectContaining({
        lastPasswordChange: expect.any(Date),
      }),
    );
    expect(mockRefreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(
      'user-id-123',
    );
  });

  it('should throw UnauthorizedException when user not found', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'nonexistent',
        currentPassword: 'OldStr0ng!Pass',
        newPassword: 'NewStr0ng!Pass',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when current password is wrong', async () => {
    const user = createMockUser();
    mockUserRepository.findById.mockResolvedValue(user);
    bcryptCompare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: 'user-id-123',
        currentPassword: 'WrongPass1!',
        newPassword: 'NewStr0ng!Pass',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw BadRequestException when new password is same as current', async () => {
    const user = createMockUser();
    mockUserRepository.findById.mockResolvedValue(user);
    bcryptCompare.mockResolvedValueOnce(true); // current password valid
    bcryptCompare.mockResolvedValueOnce(true); // new == current

    await expect(
      useCase.execute({
        userId: 'user-id-123',
        currentPassword: 'Str0ng!Pass',
        newPassword: 'Str0ng!Pass',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should invalidate all refresh tokens after password change (RN-046)', async () => {
    const user = createMockUser();
    mockUserRepository.findById.mockResolvedValue(user);
    bcryptCompare.mockResolvedValueOnce(true);
    bcryptCompare.mockResolvedValueOnce(false);
    bcryptHash.mockResolvedValue('$2b$12$newhashedpassword');
    mockUserRepository.update.mockResolvedValue(user);
    mockRefreshTokenRepository.revokeAllByUserId.mockResolvedValue(undefined);

    await useCase.execute({
      userId: 'user-id-123',
      currentPassword: 'OldStr0ng!Pass',
      newPassword: 'NewStr0ng!Pass',
    });

    expect(mockRefreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(
      'user-id-123',
    );
  });
});
