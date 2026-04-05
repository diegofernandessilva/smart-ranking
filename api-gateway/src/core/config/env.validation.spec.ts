import { describe, it, expect } from 'vitest';
import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validEnv = {
    APP_PORT: '3000',
    MONGODB_URL: 'mongodb://localhost:27017/test',
    RABBITMQ_URL: 'amqp://admin:admin@localhost:5672/smartranking',
    RABBITMQ_USER: 'admin',
    RABBITMQ_PASSWORD: 'admin',
    RABBITMQ_VHOST: 'smartranking',
  };

  it('should validate correct env vars', () => {
    const result = validateEnv(validEnv);

    expect(result).toBeDefined();
    expect(result.APP_PORT).toBe(3000);
    expect(result.MONGODB_URL).toBe('mongodb://localhost:27017/test');
    expect(result.RABBITMQ_URL).toBe(
      'amqp://admin:admin@localhost:5672/smartranking',
    );
  });

  it('should use default APP_PORT when not provided', () => {
    const { APP_PORT: _, ...envWithoutPort } = validEnv;
    const result = validateEnv(envWithoutPort);

    expect(result.APP_PORT).toBe(3000);
  });

  it('should use default RABBITMQ_USER when not provided', () => {
    const { RABBITMQ_USER: _, ...envWithoutUser } = validEnv;
    const result = validateEnv(envWithoutUser);

    expect(result.RABBITMQ_USER).toBe('admin');
  });

  it('should coerce APP_PORT string to number', () => {
    const result = validateEnv({ ...validEnv, APP_PORT: '8080' });

    expect(result.APP_PORT).toBe(8080);
  });

  it('should throw when MONGODB_URL is missing', () => {
    const { MONGODB_URL: _, ...envWithoutMongo } = validEnv;

    expect(() => validateEnv(envWithoutMongo)).toThrowError(
      /Environment validation failed/,
    );
  });

  it('should throw when MONGODB_URL is not a valid URL', () => {
    expect(() =>
      validateEnv({ ...validEnv, MONGODB_URL: 'not-a-url' }),
    ).toThrowError(/Environment validation failed/);
  });

  it('should throw when RABBITMQ_URL is missing', () => {
    const { RABBITMQ_URL: _, ...envWithoutRabbitmq } = validEnv;

    expect(() => validateEnv(envWithoutRabbitmq)).toThrowError(
      /Environment validation failed/,
    );
  });
});
