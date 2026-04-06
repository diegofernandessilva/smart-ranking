import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { RegisterUseCase } from './register.use-case';
import { AbstractIdGenerator } from '~/modules/auth/application/gateways/providers/abstract-id-generator';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { UserEntity } from '~/modules/auth/domain/entities/user.entity';
import { Email } from '~/modules/auth/domain/value-objects/email.vo';
import { Password } from '~/modules/auth/domain/value-objects/password.vo';
import { PhoneNumber } from '~/modules/auth/domain/value-objects/phone-number.vo';
import { UserRole } from '~/modules/auth/domain/enums/user-role.enum';

vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('$2b$12$hashedpassword'),
}));

const mockUserRepository: Record<keyof AbstractUserRepository, ReturnType<typeof vi.fn>> = {
  create: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
  findByResetToken: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
};

const mockIdGenerator: Record<keyof AbstractIdGenerator, ReturnType<typeof vi.fn>> = {
  generate: vi.fn().mockReturnValue('generated-id'),
};

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new RegisterUseCase(
      mockUserRepository as unknown as AbstractUserRepository,
      mockIdGenerator as unknown as AbstractIdGenerator,
    );
  });

  const validInput = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Str0ng!Pass',
    phoneNumber: '11999999999',
  };

  it('should register a new user successfully', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockImplementation(
      async (user: UserEntity) => user,
    );

    const result = await useCase.execute(validInput);

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('john@example.com');
    expect(result.user.name).toBe('John Doe');
    expect(result.user.role).toBe('PLAYER');
    expect(result.user.isActive).toBe(true);
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      'john@example.com',
    );
    expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should hash the password with bcrypt', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockImplementation(
      async (user: UserEntity) => user,
    );

    const result = await useCase.execute(validInput);

    // The created user should NOT have the plaintext password
    const createdUser = vi.mocked(mockUserRepository.create).mock
      .calls[0][0] as UserEntity;
    expect(createdUser.password.value).toBe('$2b$12$hashedpassword');
    expect(result.user).not.toHaveProperty('password');
  });

  it('should throw ConflictException if email already exists', async () => {
    const existingUser = UserEntity.create('existing-id', {
      email: new Email('john@example.com'),
      password: Password.fromHash('$2b$12$hash'),
      name: 'Existing User',
      phoneNumber: new PhoneNumber('11888888888'),
    });
    mockUserRepository.findByEmail.mockResolvedValue(existingUser);

    await expect(useCase.execute(validInput)).rejects.toThrow(
      ConflictException,
    );
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });

  it('should default role to PLAYER', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockImplementation(
      async (user: UserEntity) => user,
    );

    const result = await useCase.execute(validInput);

    expect(result.user.role).toBe(UserRole.PLAYER);
  });

  it('should not return password in the user DTO', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockImplementation(
      async (user: UserEntity) => user,
    );

    const result = await useCase.execute(validInput);

    expect(result.user).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('failedLoginAttempts');
    expect(result.user).not.toHaveProperty('lockedUntil');
  });
});
