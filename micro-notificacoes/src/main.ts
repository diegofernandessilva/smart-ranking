import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './core/interceptors/timeout.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT', 3003);

  const rmqUser = configService.get<string>('RABBITMQ_USER', 'admin');
  const rmqPass = configService.get<string>('RABBITMQ_PASSWORD', 'admin');
  const rmqHost = configService.get<string>('RABBITMQ_HOST', 'localhost');
  const rmqPort = configService.get<number>('RABBITMQ_PORT', 5672);
  const rmqVhost = configService.get<string>('RABBITMQ_VHOST', 'smartranking');
  const rmqUrl = `amqp://${rmqUser}:${rmqPass}@${rmqHost}:${rmqPort}/${rmqVhost}`;

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'notificacoes',
      noAck: false,
      queueOptions: { durable: true },
    },
  });

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
  app.useGlobalInterceptors(new LoggingInterceptor(), new TimeoutInterceptor());

  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap();
