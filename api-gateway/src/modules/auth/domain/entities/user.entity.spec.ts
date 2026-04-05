import { describe, it, expect, vi } from 'vitest';
import { UserEntity } from './user.entity';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';
import { UserRole } from '../enums/user-role.enum';
import { IUserProps } from './user.interface';

const makeProps = (
  overrides?: Partial<IUserProps>,
): IUserProps => ({
  email: new Email('user@example.com'),
  password: new Password('Str0ng!Pass'),
  name: 'Test User',
  phoneNumber: new PhoneNumber('+5511999998888'),
  role: UserRole.PLAYER,
  isActive: true,
  failedLoginAttempts: 0,
  ...overrides,
});

describe('UserEntity', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  describe('constructor', () => {
    it('should create a user entity with all props', () => {
      const props = makeProps();
      const user = new UserEntity('user-1', props, now, now);

      expect(user.id).toBe('user-1');
      expect(user.email.value).toBe('user@example.com');
      expect(user.password.value).toBe('Str0ng!Pass');
      expect(user.name).toBe('Test User');
      expect(user.phoneNumber.value).toBe('+5511999998888');
      expect(user.role).toBe(UserRole.PLAYER);
      expect(user.isActive).toBe(true);
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeUndefined();
      expect(user.deletedAt).toBeNull();
    });

    it('should create a user with optional fields', () => {
      const lockedUntil = new Date('2026-06-01T00:00:00Z');
      const props = makeProps({
        lockedUntil,
        passwordResetToken: 'reset-hash',
        passwordResetExpires: new Date('2026-02-01T00:00:00Z'),
        lastPasswordChange: new Date('2026-01-15T00:00:00Z'),
      });
      const user = new UserEntity('user-1', props, now, now);

      expect(user.lockedUntil).toBe(lockedUntil);
      expect(user.passwordResetToken).toBe('reset-hash');
      expect(user.passwordResetExpires).toEqual(
        new Date('2026-02-01T00:00:00Z'),
      );
      expect(user.lastPasswordChange).toEqual(
        new Date('2026-01-15T00:00:00Z'),
      );
    });
  });

  describe('static create', () => {
    it('should create a user with defaults', () => {
      const user = UserEntity.create('user-1', {
        email: new Email('user@example.com'),
        password: new Password('Str0ng!Pass'),
        name: 'Test User',
        phoneNumber: new PhoneNumber('+5511999998888'),
      });

      expect(user.id).toBe('user-1');
      expect(user.role).toBe(UserRole.PLAYER);
      expect(user.isActive).toBe(true);
      expect(user.failedLoginAttempts).toBe(0);
    });

    it('should allow overriding defaults in create', () => {
      const user = UserEntity.create('user-1', {
        email: new Email('admin@example.com'),
        password: new Password('Adm1n!Pass'),
        name: 'Admin User',
        phoneNumber: new PhoneNumber('+5521999997777'),
        role: UserRole.ADMIN,
      });

      expect(user.role).toBe(UserRole.ADMIN);
    });
  });

  describe('lockout logic', () => {
    it('should increment failed login attempts', () => {
      const user = new UserEntity('user-1', makeProps(), now, now);

      user.incrementFailedLoginAttempts();
      expect(user.failedLoginAttempts).toBe(1);

      user.incrementFailedLoginAttempts();
      expect(user.failedLoginAttempts).toBe(2);
    });

    it('should reset failed login attempts and clear lockedUntil', () => {
      const props = makeProps({
        failedLoginAttempts: 5,
        lockedUntil: new Date('2026-12-01T00:00:00Z'),
      });
      const user = new UserEntity('user-1', props, now, now);

      user.resetFailedLoginAttempts();

      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeUndefined();
    });

    it('should lock the user for a given duration', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));

      const user = new UserEntity('user-1', makeProps(), now, now);
      const thirtyMinutes = 30 * 60 * 1000;

      user.lock(thirtyMinutes);

      expect(user.lockedUntil).toEqual(
        new Date('2026-06-01T12:30:00Z'),
      );
      expect(user.isLocked()).toBe(true);

      vi.useRealTimers();
    });

    it('should report not locked when lockedUntil is in the past', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-01T13:00:00Z'));

      const props = makeProps({
        lockedUntil: new Date('2026-06-01T12:30:00Z'),
      });
      const user = new UserEntity('user-1', props, now, now);

      expect(user.isLocked()).toBe(false);

      vi.useRealTimers();
    });

    it('should report not locked when lockedUntil is undefined', () => {
      const user = new UserEntity('user-1', makeProps(), now, now);
      expect(user.isLocked()).toBe(false);
    });
  });

  describe('soft delete (inherited)', () => {
    it('should mark user as deleted', () => {
      const user = new UserEntity('user-1', makeProps(), now, now);
      expect(user.isDeleted).toBe(false);

      user.markAsDeleted();

      expect(user.isDeleted).toBe(true);
      expect(user.deletedAt).toBeInstanceOf(Date);
    });

    it('should restore a deleted user', () => {
      const user = new UserEntity('user-1', makeProps(), now, now, now);
      expect(user.isDeleted).toBe(true);

      user.restore();

      expect(user.isDeleted).toBe(false);
      expect(user.deletedAt).toBeNull();
    });
  });
});
