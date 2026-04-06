import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { AbstractRefreshTokenRepository } from '~/modules/auth/application/gateways/repositories/abstract-refresh-token.repository';
import { UserEntity } from '~/modules/auth/domain/entities/user.entity';
import { Email } from '~/modules/auth/domain/value-objects/email.vo';
import { Password } from '~/modules/auth/domain/value-objects/password.vo';
import { PhoneNumber } from '~/modules/auth/domain/value-objects/phone-number.vo';

vi.mock('bcrypt', () => ({
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

function createMockUserWithResetToken(
  expiresAt: Date = new Date(Date.now() + 60 * 60 * 1000),
): UserEntity {
  const now = new Date();
  return new UserEntity(
    'user-id-123',
    {
      email: new Email('john@example.com'),
      password: Password.fromHash('$2b$12$hashedpassword'),
      name: 'John Doe',
      phoneNumber: new PhoneNumber('11999999999'),
      role: 'PLAYER' as never,
      isActive: true,
      failedLoginAttempts: 0,
      passwordResetToken: 'stored-token-hash',
      passwordResetExpires: expiresAt,
    },
    now,
    now,
  );
}

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    useCase = new ResetPasswordUseCase(
      mockUserRepository as unknown as AbstractUserRepository,
      mockRefreshTokenRepository as unknown as AbstractRefreshTokenRepository,
    );
  });

  it('should reset password with valid token', async () => {
    const user = createMockUserWithResetToken();
    mockUserRepository.findByResetToken.mockResolvedValue(user);
    mockUserRepository.update.mockResolvedValue(user);
    mockRefreshTokenRepository.revokeAllByUserId.mockResolvedValue(undefined);

    await useCase.execute({
      token: 'raw-reset-token',
      newPassword: 'NewStr0ng!Pass',
    });

    expect(mockUserRepository.update).toHaveBeenCalledWith(
      'user-id-123',
      expect.objectContaining({
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
        lastPasswordChange: expect.any(Date),
      }),
    );
    expect(mockRefreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(
      'user-id-123',
    );
  });

  it('should throw BadRequestException for invalid token', async () => {
    mockUserRepository.findByResetToken.mockResolvedValue(null);

    await expect(
      useCase.execute({
        token: 'invalid-token',
        newPassword: 'NewStr0ng!Pass',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for expired token (RN-045)', async () => {
    const expiredDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const user = createMockUserWithResetToken(expiredDate);
    mockUserRepository.findByResetToken.mockResolvedValue(user);

    await expect(
      useCase.execute({
        token: 'raw-reset-token',
        newPassword: 'NewStr0ng!Pass',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should clear reset token after use (single-use)', async () => {
    const user = createMockUserWithResetToken();
    mockUserRepository.findByResetToken.mockResolvedValue(user);
    mockUserRepository.update.mockResolvedValue(user);
    mockRefreshTokenRepository.revokeAllByUserId.mockResolvedValue(undefined);

    await useCase.execute({
      token: 'raw-reset-token',
      newPassword: 'NewStr0ng!Pass',
    });

    const updateCall = mockUserRepository.update.mock.calls[0];
    expect(updateCall[1].passwordResetToken).toBeUndefined();
    expect(updateCall[1].passwordResetExpires).toBeUndefined();
  });

  it('should invalidate all refresh tokens after reset', async () => {
    const user = createMockUserWithResetToken();
    mockUserRepository.findByResetToken.mockResolvedValue(user);
    mockUserRepository.update.mockResolvedValue(user);
    mockRefreshTokenRepository.revokeAllByUserId.mockResolvedValue(undefined);

    await useCase.execute({
      token: 'raw-reset-token',
      newPassword: 'NewStr0ng!Pass',
    });

    expect(mockRefreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(
      'user-id-123',
    );
  });
});
