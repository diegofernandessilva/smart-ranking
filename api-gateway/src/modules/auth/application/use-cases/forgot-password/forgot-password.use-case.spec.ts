import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForgotPasswordUseCase } from './forgot-password.use-case';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { UserEntity } from '~/modules/auth/domain/entities/user.entity';
import { Email } from '~/modules/auth/domain/value-objects/email.vo';
import { Password } from '~/modules/auth/domain/value-objects/password.vo';
import { PhoneNumber } from '~/modules/auth/domain/value-objects/phone-number.vo';

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

function createMockUser(): UserEntity {
  return UserEntity.create('user-id-123', {
    email: new Email('john@example.com'),
    password: Password.fromHash('$2b$12$hashedpassword'),
    name: 'John Doe',
    phoneNumber: new PhoneNumber('11999999999'),
  });
}

describe('ForgotPasswordUseCase', () => {
  let useCase: ForgotPasswordUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    useCase = new ForgotPasswordUseCase(
      mockUserRepository as unknown as AbstractUserRepository,
    );
  });

  it('should generate reset token when email exists', async () => {
    const user = createMockUser();
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockUserRepository.update.mockResolvedValue(user);

    await useCase.execute({ email: 'john@example.com' });

    expect(mockUserRepository.update).toHaveBeenCalledWith(
      'user-id-123',
      expect.objectContaining({
        passwordResetToken: expect.any(String),
        passwordResetExpires: expect.any(Date),
      }),
    );
  });

  it('should not throw when email does not exist (RN-047)', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    // Should NOT throw — always returns success
    await expect(
      useCase.execute({ email: 'nonexistent@example.com' }),
    ).resolves.toBeUndefined();

    // Should NOT attempt to update
    expect(mockUserRepository.update).not.toHaveBeenCalled();
  });

  it('should store SHA-256 hash of token, not raw token', async () => {
    const user = createMockUser();
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockUserRepository.update.mockResolvedValue(user);

    await useCase.execute({ email: 'john@example.com' });

    const updateCall = mockUserRepository.update.mock.calls[0];
    const storedToken = updateCall[1].passwordResetToken as string;

    // SHA-256 hash is 64 hex chars
    expect(storedToken).toHaveLength(64);
    // Raw token is 'a'.repeat(64) — stored hash should be different
    expect(storedToken).not.toBe('a'.repeat(64));
  });

  it('should set expiration to 1 hour from now (RN-045)', async () => {
    const user = createMockUser();
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockUserRepository.update.mockResolvedValue(user);

    const before = Date.now();
    await useCase.execute({ email: 'john@example.com' });
    const after = Date.now();

    const updateCall = mockUserRepository.update.mock.calls[0];
    const expires = updateCall[1].passwordResetExpires as Date;
    const oneHourMs = 60 * 60 * 1000;

    expect(expires.getTime()).toBeGreaterThanOrEqual(before + oneHourMs);
    expect(expires.getTime()).toBeLessThanOrEqual(after + oneHourMs);
  });
});
