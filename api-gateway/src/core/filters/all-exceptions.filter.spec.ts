import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ArgumentsHost } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/test', method: 'GET' }),
      }),
      getArgs: () => [],
      getArgByIndex: () => undefined,
      switchToRpc: () => ({} as ReturnType<ArgumentsHost['switchToRpc']>),
      switchToWs: () => ({} as ReturnType<ArgumentsHost['switchToWs']>),
      getType: () => 'http' as const,
    } as unknown as ArgumentsHost;
  });

  it('should return standardized error format for HttpException', () => {
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
        path: '/test',
        error: 'Not found',
      }),
    );
  });

  it('should return 500 for unknown errors', () => {
    const exception = new Error('Something broke');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/test',
        error: 'Internal server error',
      }),
    );
  });

  it('should handle validation errors with array messages', () => {
    const exception = new BadRequestException({
      message: ['field1 is required', 'field2 must be a string'],
    });

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'field1 is required, field2 must be a string',
      }),
    );
  });

  it('should include ISO timestamp', () => {
    const exception = new HttpException('Test', 400);

    filter.catch(exception, mockHost);

    const response = mockJson.mock.calls[0][0];
    expect(() => new Date(response.timestamp)).not.toThrow();
  });
});
