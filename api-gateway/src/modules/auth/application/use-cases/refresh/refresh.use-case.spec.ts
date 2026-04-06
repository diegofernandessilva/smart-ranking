import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { RefreshUseCase } from './refresh.use-case';
import { AbstractIdGenerator } from '~/modules/auth/application/gateways/providers/abstract-id-generator';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { AbstractRefreshTokenRepository } from '~/modules/auth/application/gateways/repositories/abstract-refresh-token.repository';
import { RefreshTokenEntity } from '~/modules/auth/domain/entities/refresh-token.entity';
import { UserEntity } from '~/modules/auth/domain/entities/user.entity';
import { Email } from '~/modules/auth/domain/value-objects/email.vo';
import { Password } from '~/modules/auth/domain/value-objects/password.vo';
import { PhoneNumber } from '~/modules/auth/domain/value-objects/phone-number.vo';

const mockUserRepository: Record<keyof AbstractUserRepository, ReturnType<typeof vi.fn>> = {
  create: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
};

const mockRefreshTokenRepository: Record<keyof AbstractRefreshTokenRepository, ReturnType<typeof vi.fn>> = {
  create: vi.fn(),
  findByTokenHash: vi.fn(),
  revokeByTokenHash: vi.fn(),
  revokeAllByUserId: vi.fn(),
};

const mockIdGenerator: Record<keyof AbstractIdGenerator, ReturnType<typeof vi.fn>> = {
  generate: vi.fn().mockReturnValue('generated-id'),
};

const mockJwtService = {
  sign: vi.fn().mockReturnValue('new.jwt.token'),
};

const mockConfigService = {
  get: vi.fn((key: string) => {
    const config: Record<string, string | number> = {
      JWT_PRIVATE_KEY: 'mock-private-key',
      JWT_PUBLIC_KEY: 'mock-public-key',
      JWT_ACCESS_EXPIRATION: '15m',
      JWT_REFRESH_EXPIRATION_DAYS: 7,
    };
    return config[key];
  }),
};

function createMockUser(): UserEntity {
  return UserEntity.create('user-id-123', {
    email: new Email('john@example.com'),
    password: Password.fromHash('$2b$12$hashedpassword'),
    name: 'John Doe',
    phoneNumber: new PhoneNumber('11999999999'),
  });
}

function createMockRefreshToken(overrides: Partial<{
  isRevoked: boolean;
  expiresAt: Date;
  replacedByHash: string;
}> = {}): RefreshTokenEntity {
  return RefreshTokenEntity.create('token-id-123', {
    userId: 'user-id-123',
    tokenHash: 'existing-hash',
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ...(overrides.isRevoked !== undefined ? { isRevoked: overrides.isRevoked } : {}),
  });
}

const RAW_REFRESH_TOKEN = 'a'.repeat(64);

describe('RefreshUseCase', () => {
  let useCase: RefreshUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new RefreshUseCase(
      mockUserRepository as unknown as AbstractUserRepository,
      mockRefreshTokenRepository as unknown as AbstractRefreshTokenRepository,
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService,
      mockIdGenerator as unknown as AbstractIdGenerator,
    );
  });

  it('should rotate refresh token successfully', async () => {
    const token = createMockRefreshToken();
    const user = createMockUser();
    const inputHash = crypto
      .createHash('sha256')
      .update(RAW_REFRESH_TOKEN)
      .digest('hex');

    mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(token);
    mockUserRepository.findById.mockResolvedValue(user);
    mockRefreshTokenRepository.revokeByTokenHash.mockResolvedValue(undefined);
    mockRefreshTokenRepository.create.mockResolvedValue(undefined);

    const result = await useCase.execute({ refreshToken: RAW_REFRESH_TOKEN });

    expect(result.accessToken).toBe('new.jwt.token');
    expect(result.refreshToken).toBeDefined();
    expect(mockRefreshTokenRepository.findByTokenHash).toHaveBeenCalledWith(inputHash);
    expect(mockRefreshTokenRepository.revokeByTokenHash).toHaveBeenCalledWith(inputHash);
    expect(mockRefreshTokenRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should throw if token not found', async () => {
    mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: RAW_REFRESH_TOKEN }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should detect stolen token (reuse) and revoke all user tokens', async () => {
    const revokedToken = createMockRefreshToken({ isRevoked: true });
    mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(revokedToken);
    mockRefreshTokenRepository.revokeAllByUserId.mockResolvedValue(undefined);

    await expect(
      useCase.execute({ refreshToken: RAW_REFRESH_TOKEN }),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockRefreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(
      'user-id-123',
    );
  });

  it('should throw if token is expired', async () => {
    const expiredToken = createMockRefreshToken({
      expiresAt: new Date(Date.now() - 1000),
    });
    mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(expiredToken);

    await expect(
      useCase.execute({ refreshToken: RAW_REFRESH_TOKEN }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw if user not found', async () => {
    const token = createMockRefreshToken();
    mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(token);
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: RAW_REFRESH_TOKEN }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
