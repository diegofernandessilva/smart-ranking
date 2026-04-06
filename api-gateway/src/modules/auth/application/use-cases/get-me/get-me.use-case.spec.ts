import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { GetMeUseCase } from './get-me.use-case';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { UserEntity } from '~/modules/auth/domain/entities/user.entity';
import { Email } from '~/modules/auth/domain/value-objects/email.vo';
import { Password } from '~/modules/auth/domain/value-objects/password.vo';
import { PhoneNumber } from '~/modules/auth/domain/value-objects/phone-number.vo';

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

describe('GetMeUseCase', () => {
  let useCase: GetMeUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    useCase = new GetMeUseCase(
      mockUserRepository as unknown as AbstractUserRepository,
    );
  });

  it('should return user DTO for authenticated user', async () => {
    const user = createMockUser();
    mockUserRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute({ userId: 'user-id-123' });

    expect(result.user).toEqual(
      expect.objectContaining({
        id: 'user-id-123',
        email: 'john@example.com',
        name: 'John Doe',
        phoneNumber: '11999999999',
        role: 'PLAYER',
        isActive: true,
      }),
    );
    expect(result.user).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('passwordResetToken');
    expect(result.user).not.toHaveProperty('failedLoginAttempts');
  });

  it('should throw NotFoundException when user not found', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'nonexistent' }),
    ).rejects.toThrow(NotFoundException);
  });
});
