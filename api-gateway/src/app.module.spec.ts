import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeAll } from 'vitest';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppModule', () => {
  beforeAll(() => {
    process.env.MONGODB_URL = 'mongodb://localhost:27017/test';
    process.env.RABBITMQ_URL = 'amqp://admin:admin@localhost:5672/smartranking';
  });

  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    expect(module).toBeDefined();
  });
});
