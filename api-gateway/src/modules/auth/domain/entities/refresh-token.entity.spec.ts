import { describe, it, expect, vi } from 'vitest';
import { RefreshTokenEntity } from './refresh-token.entity';
import { IRefreshTokenProps } from './refresh-token.interface';

const makeProps = (
  overrides?: Partial<IRefreshTokenProps>,
): IRefreshTokenProps => ({
  userId: 'user-1',
  tokenHash: 'hash-abc123',
  expiresAt: new Date('2026-01-08T00:00:00Z'),
  isRevoked: false,
  ...overrides,
});

describe('RefreshTokenEntity', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  describe('constructor', () => {
    it('should create a refresh token entity', () => {
      const props = makeProps();
      const token = new RefreshTokenEntity(
        'token-1',
        props,
        now,
        now,
      );

      expect(token.id).toBe('token-1');
      expect(token.userId).toBe('user-1');
      expect(token.tokenHash).toBe('hash-abc123');
      expect(token.expiresAt).toEqual(
        new Date('2026-01-08T00:00:00Z'),
      );
      expect(token.isRevoked).toBe(false);
      expect(token.replacedByHash).toBeUndefined();
    });

    it('should create with replacedByHash', () => {
      const props = makeProps({
        isRevoked: true,
        replacedByHash: 'new-hash-xyz',
      });
      const token = new RefreshTokenEntity(
        'token-1',
        props,
        now,
        now,
      );

      expect(token.isRevoked).toBe(true);
      expect(token.replacedByHash).toBe('new-hash-xyz');
    });
  });

  describe('static create', () => {
    it('should create with default isRevoked=false', () => {
      const token = RefreshTokenEntity.create('token-1', {
        userId: 'user-1',
        tokenHash: 'hash-abc',
        expiresAt: new Date('2026-01-08T00:00:00Z'),
      });

      expect(token.isRevoked).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should return true when token is expired', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-10T00:00:00Z'));

      const props = makeProps({
        expiresAt: new Date('2026-01-08T00:00:00Z'),
      });
      const token = new RefreshTokenEntity(
        'token-1',
        props,
        now,
        now,
      );

      expect(token.isExpired()).toBe(true);

      vi.useRealTimers();
    });

    it('should return false when token is not expired', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-05T00:00:00Z'));

      const props = makeProps({
        expiresAt: new Date('2026-01-08T00:00:00Z'),
      });
      const token = new RefreshTokenEntity(
        'token-1',
        props,
        now,
        now,
      );

      expect(token.isExpired()).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('revoke', () => {
    it('should revoke the token', () => {
      const token = new RefreshTokenEntity(
        'token-1',
        makeProps(),
        now,
        now,
      );

      expect(token.isRevoked).toBe(false);
      token.revoke();
      expect(token.isRevoked).toBe(true);
    });
  });

  describe('replaceWith', () => {
    it('should revoke and set replacedByHash', () => {
      const token = new RefreshTokenEntity(
        'token-1',
        makeProps(),
        now,
        now,
      );

      token.replaceWith('new-hash-xyz');

      expect(token.isRevoked).toBe(true);
      expect(token.replacedByHash).toBe('new-hash-xyz');
    });
  });
});
