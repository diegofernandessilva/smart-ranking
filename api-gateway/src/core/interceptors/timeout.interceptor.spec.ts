import { describe, it, expect, vi } from 'vitest';
import { TimeoutInterceptor } from './timeout.interceptor';
import { of, delay, firstValueFrom } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';

describe('TimeoutInterceptor', () => {
  const interceptor = new TimeoutInterceptor();

  const mockContext = {} as ExecutionContext;

  it('should pass through responses within timeout', async () => {
    const mockHandler: CallHandler = {
      handle: () => of('result'),
    };

    const result$ = interceptor.intercept(mockContext, mockHandler);
    const result = await firstValueFrom(result$);

    expect(result).toBe('result');
  });

  it('should throw RequestTimeoutException for slow responses', async () => {
    vi.useFakeTimers();

    const mockHandler: CallHandler = {
      handle: () => of('result').pipe(delay(15_000)),
    };

    const result$ = interceptor.intercept(mockContext, mockHandler);
    const promise = firstValueFrom(result$);

    vi.advanceTimersByTime(11_000);

    await expect(promise).rejects.toThrow();

    vi.useRealTimers();
  });
});
