import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginUseCase } from './login.use-case';
import { AbstractIdGenerator } from '~/modules/auth/application/gateways/providers/abstract-id-generator';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { AbstractRefreshTokenRepository } from '~/modules/auth/application/gateways/repositories/abstract-refresh-token.repository';
import { UserEntity } from '~/modules/auth/domain/entities/user.entity';
import { Email } from '~/modules/auth/domain/value-objects/email.vo';
import { Password } from '~/modules/auth/domain/value-objects/password.vo';
import { PhoneNumber } from '~/modules/auth/domain/value-objects/phone-number.vo';
import { UserRole } from '~/modules/auth/domain/enums/user-role.enum';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
}));

vi.mock('crypto', async () => {
  const actual = await vi.importActual<typeof import('crypto')>('crypto');
  return {
    ...actual,
    randomBytes: vi.fn().mockReturnValue({
      toString: () => 'a'.repeat(64),
    }),
  };
});

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

const mockIdGenerator: Record<keyof AbstractIdGenerator, ReturnType<typeof vi.fn>> = {
  generate: vi.fn().mockReturnValue('generated-id'),
};

const mockJwtService = {
  sign: vi.fn().mockReturnValue('mock.jwt.token'),
};

const mockConfigService = {
  get: vi.fn((key: string) => {
    const config: Record<string, string | number> = {
      JWT_PRIVATE_KEY: 'mock-private-key',
      JWT_ACCESS_EXPIRATION: '15m',
      JWT_REFRESH_EXPIRATION_DAYS: 7,
    };
    return config[key];
  }),
};

function createMockUser(overrides: Partial<{
  failedLoginAttempts: number;
  lockedUntil: Date;
  isActive: boolean;
}> = {}): UserEntity {
  return UserEntity.create('user-id-123', {
    email: new Email('john@example.com'),
    password: Password.fromHash('$2b$12$hashedpassword'),
    name: 'John Doe',
    phoneNumber: new PhoneNumber('11999999999'),
    ...overrides,
  });
}

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let bcryptCompare: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const bcrypt = await import('bcrypt');
    bcryptCompare = vi.mocked(bcrypt.compare);

    useCase = new LoginUseCase(
      mockUserRepository as unknown as AbstractUserRepository,
      mockRefreshTokenRepository as unknown as AbstractRefreshTokenRepository,
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService,
      mockIdGenerator as unknown as AbstractIdGenerator,
    );
  });

  const validInput = {
    email: 'john@example.com',
    password: 'Str0ng!Pass',
  };

  it('should login successfully and return tokens', async () => {
    const user = createMockUser();
    mockUserRepository.findByEmail.mockResolvedValue(user);
    bcryptCompare.mockResolvedValue(true);
    mockRefreshTokenRepository.create.mockResolvedValue(undefined);

    const result = await useCase.execute(validInput);

    expect(result.accessToken).toBe('mock.jwt.token');
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe('john@example.com');
    expect(result.user).not.toHaveProperty('password');
  });

  it('should throw UnauthorizedException when user not found', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute(validInput)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException on wrong password', async () => {
    const user = createMockUser();
    mockUserRepository.findByEmail.mockResolvedValue(user);
    bcryptCompare.mockResolvedValue(false);
    mockUserRepository.update.mockResolvedValue(user);

    await expect(useCase.execute(validInput)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockUserRepository.update).toHaveBeenCalledWith(
      'user-id-123',
      expect.objectContaining({ failedLoginAttempts: 1 }),
    );
  });

  it('should lock account after 5 failed attempts', async () => {
    const user = createMockUser({ failedLoginAttempts: 4 });
    mockUserRepository.findByEmail.mockResolvedValue(user);
    bcryptCompare.mockResolvedValue(false);
    mockUserRepository.update.mockResolvedValue(user);

    await expect(useCase.execute(validInput)).rejects.toThrow(
      UnauthorizedException,
    );

    const updateCall = vi.mocked(mockUserRepository.update).mock.calls[0];
    expect(updateCall[1]).toHaveProperty('failedLoginAttempts', 5);
    expect(updateCall[1]).toHaveProperty('lockedUntil');
    expect(updateCall[1].lockedUntil).toBeInstanceOf(Date);
  });

  it('should throw 423 when account is locked', async () => {
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    const user = createMockUser({
      failedLoginAttempts: 5,
      lockedUntil,
    });
    mockUserRepository.findByEmail.mockResolvedValue(user);

    try {
      await useCase.execute(validInput);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.LOCKED);
      expect((error as HttpException).message).toContain(
        'Account temporarily locked',
      );
    }
  });

  it('should reset failed attempts on successful login', async () => {
    const user = createMockUser({ failedLoginAttempts: 3 });
    mockUserRepository.findByEmail.mockResolvedValue(user);
    bcryptCompare.mockResolvedValue(true);
    mockUserRepository.update.mockResolvedValue(user);
    mockRefreshTokenRepository.create.mockResolvedValue(undefined);

    await useCase.execute(validInput);

    expect(mockUserRepository.update).toHaveBeenCalledWith(
      'user-id-123',
      expect.objectContaining({
        failedLoginAttempts: 0,
        lockedUntil: undefined,
      }),
    );
  });

  it('should not update if no previous failed attempts', async () => {
    const user = createMockUser({ failedLoginAttempts: 0 });
    mockUserRepository.findByEmail.mockResolvedValue(user);
    bcryptCompare.mockResolvedValue(true);
    mockRefreshTokenRepository.create.mockResolvedValue(undefined);

    await useCase.execute(validInput);

    // Should not call update since failedLoginAttempts is already 0
    expect(mockUserRepository.update).not.toHaveBeenCalled();
  });

  it('should generate JWT with correct claims', async () => {
    const user = createMockUser();
    mockUserRepository.findByEmail.mockResolvedValue(user);
    bcryptCompare.mockResolvedValue(true);
    mockRefreshTokenRepository.create.mockResolvedValue(undefined);

    await useCase.execute(validInput);

    expect(mockJwtService.sign).toHaveBeenCalledWith(
      {
        sub: 'user-id-123',
        email: 'john@example.com',
        role: UserRole.PLAYER,
      },
      {
        privateKey: 'mock-private-key',
        algorithm: 'RS256',
        expiresIn: '15m',
      },
    );
  });

  it('should store refresh token hash in repository', async () => {
    const user = createMockUser();
    mockUserRepository.findByEmail.mockResolvedValue(user);
    bcryptCompare.mockResolvedValue(true);
    mockRefreshTokenRepository.create.mockResolvedValue(undefined);

    await useCase.execute(validInput);

    expect(mockRefreshTokenRepository.create).toHaveBeenCalledTimes(1);
  });
});
