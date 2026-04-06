import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '~/modules/auth/domain/enums/user-role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;
    guard = new RolesGuard(reflector);
  });

  function createMockContext(
    user?: { sub: string; email: string; role: string },
  ): ExecutionContext {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no roles are required', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);
    const context = createMockContext({
      sub: 'user-1',
      email: 'john@example.com',
      role: UserRole.PLAYER,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({
      sub: 'user-1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({
      sub: 'user-1',
      email: 'john@example.com',
      role: UserRole.PLAYER,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access when user is not authenticated', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow when user has one of multiple required roles', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([
      UserRole.ADMIN,
      UserRole.PLAYER,
    ]);
    const context = createMockContext({
      sub: 'user-1',
      email: 'john@example.com',
      role: UserRole.PLAYER,
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
