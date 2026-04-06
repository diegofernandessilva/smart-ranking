import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;
    guard = new JwtAuthGuard(reflector);
  });

  function createMockContext(): ExecutionContext {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({}),
        getResponse: vi.fn().mockReturnValue({}),
        getNext: vi.fn(),
      }),
      getType: vi.fn().mockReturnValue('http'),
    } as unknown as ExecutionContext;
  }

  it('should allow access when @Public decorator is present', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(true);
    const context = createMockContext();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should delegate to passport when @Public is not set', async () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(false);
    const context = createMockContext();

    // AuthGuard('jwt').canActivate calls passport which will reject
    // because no JWT strategy is registered in test environment
    const result = guard.canActivate(context);

    // The parent class returns a Promise that will reject (no strategy)
    // We just verify it doesn't return true (i.e., it delegates)
    expect(result).not.toBe(true);

    // Handle the unhandled rejection to prevent test noise
    if (result instanceof Promise) {
      await result.catch(() => {
        // Expected: passport strategy not configured in unit test
      });
    }

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('should check both handler and class for @Public metadata', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(true);
    const context = createMockContext();

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
