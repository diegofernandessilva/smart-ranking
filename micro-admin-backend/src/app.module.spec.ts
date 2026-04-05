import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeAll } from 'vitest';

describe('AppModule', () => {
  beforeAll(() => {
    process.env.MONGODB_URL =
      'mongodb://admin:admin@localhost:27017/smartranking?authSource=admin';
  });

  it('should compile the module', async () => {
    const { AppModule } = await import('./app.module');

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();
  });
});
