import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './core/interceptors/timeout.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const rmqUser = configService.get<string>('RABBITMQ_USER');
  const rmqPass = configService.get<string>('RABBITMQ_PASSWORD');
  const rmqHost = configService.get<string>('RABBITMQ_HOST');
  const rmqPort = configService.get<number>('RABBITMQ_PORT');
  const rmqVhost = configService.get<string>('RABBITMQ_VHOST');
  const rmqUrl = `amqp://${rmqUser}:${rmqPass}@${rmqHost}:${rmqPort}/${rmqVhost}`;

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'rankings',
      noAck: false,
      queueOptions: { durable: true },
    },
  });

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost.httpAdapter));
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(),
  );

  await app.startAllMicroservices();

  const port = configService.get<number>('APP_PORT') ?? 3004;
  await app.listen(port);
}
bootstrap();
