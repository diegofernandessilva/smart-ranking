import { describe, it, expect } from 'vitest';
import { UserMapper } from './user.mapper';
import { UserEntity } from '../entities/user.entity';
import { IUserPersistentData } from '../entities/user.interface';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';
import { UserRole } from '../enums/user-role.enum';

const now = new Date('2026-01-01T00:00:00Z');

const makeEntity = (): UserEntity =>
  new UserEntity(
    'user-1',
    {
      email: new Email('user@example.com'),
      password: new Password('Str0ng!Pass'),
      name: 'Test User',
      phoneNumber: new PhoneNumber('+5511999998888'),
      role: UserRole.PLAYER,
      isActive: true,
      failedLoginAttempts: 2,
      lockedUntil: new Date('2026-01-02T00:00:00Z'),
      passwordResetToken: 'reset-hash',
      passwordResetExpires: new Date('2026-01-01T01:00:00Z'),
      lastPasswordChange: new Date('2025-12-15T00:00:00Z'),
    },
    now,
    now,
  );

const makePersistentData = (): IUserPersistentData => ({
  _id: 'user-1',
  email: 'user@example.com',
  password: 'Str0ng!Pass',
  name: 'Test User',
  phoneNumber: '+5511999998888',
  role: 'PLAYER',
  isActive: true,
  failedLoginAttempts: 2,
  lockedUntil: new Date('2026-01-02T00:00:00Z'),
  passwordResetToken: 'reset-hash',
  passwordResetExpires: new Date('2026-01-01T01:00:00Z'),
  lastPasswordChange: new Date('2025-12-15T00:00:00Z'),
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
});

describe('UserMapper', () => {
  describe('toPersistentData', () => {
    it('should convert entity to persistent data', () => {
      const entity = makeEntity();
      const data = UserMapper.toPersistentData(entity);

      expect(data._id).toBe('user-1');
      expect(data.email).toBe('user@example.com');
      expect(data.password).toBe('Str0ng!Pass');
      expect(data.name).toBe('Test User');
      expect(data.phoneNumber).toBe('+5511999998888');
      expect(data.role).toBe('PLAYER');
      expect(data.isActive).toBe(true);
      expect(data.failedLoginAttempts).toBe(2);
      expect(data.lockedUntil).toEqual(
        new Date('2026-01-02T00:00:00Z'),
      );
      expect(data.passwordResetToken).toBe('reset-hash');
      expect(data.deletedAt).toBeNull();
      expect(data.createdAt).toBe(now);
      expect(data.updatedAt).toBe(now);
    });
  });

  describe('toEntity', () => {
    it('should convert persistent data to entity', () => {
      const data = makePersistentData();
      const entity = UserMapper.toEntity(data);

      expect(entity.id).toBe('user-1');
      expect(entity.email.value).toBe('user@example.com');
      expect(entity.password.value).toBe('Str0ng!Pass');
      expect(entity.name).toBe('Test User');
      expect(entity.phoneNumber.value).toBe('+5511999998888');
      expect(entity.role).toBe(UserRole.PLAYER);
      expect(entity.isActive).toBe(true);
      expect(entity.failedLoginAttempts).toBe(2);
      expect(entity.lockedUntil).toEqual(
        new Date('2026-01-02T00:00:00Z'),
      );
      expect(entity.deletedAt).toBeNull();
    });
  });

  describe('toDto', () => {
    it('should convert entity to DTO without sensitive fields', () => {
      const entity = makeEntity();
      const dto = UserMapper.toDto(entity);

      expect(dto.id).toBe('user-1');
      expect(dto.email).toBe('user@example.com');
      expect(dto.name).toBe('Test User');
      expect(dto.phoneNumber).toBe('+5511999998888');
      expect(dto.role).toBe('PLAYER');
      expect(dto.isActive).toBe(true);
      expect(dto.createdAt).toBe(now);

      // DTO should NOT contain sensitive fields
      expect(dto).not.toHaveProperty('password');
      expect(dto).not.toHaveProperty('failedLoginAttempts');
      expect(dto).not.toHaveProperty('lockedUntil');
      expect(dto).not.toHaveProperty('passwordResetToken');
      expect(dto).not.toHaveProperty('passwordResetExpires');
      expect(dto).not.toHaveProperty('deletedAt');
    });
  });

  describe('roundtrip', () => {
    it('should preserve data through entity → persistent → entity', () => {
      const original = makeEntity();
      const data = UserMapper.toPersistentData(original);
      const restored = UserMapper.toEntity(data);

      expect(restored.id).toBe(original.id);
      expect(restored.email.value).toBe(original.email.value);
      expect(restored.password.value).toBe(original.password.value);
      expect(restored.name).toBe(original.name);
      expect(restored.phoneNumber.value).toBe(
        original.phoneNumber.value,
      );
      expect(restored.role).toBe(original.role);
      expect(restored.isActive).toBe(original.isActive);
      expect(restored.failedLoginAttempts).toBe(
        original.failedLoginAttempts,
      );
    });
  });
});
