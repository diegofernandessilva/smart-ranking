import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './core/interceptors/timeout.interceptor';
import { ConfigService } from '@nestjs/config';
import { buildRabbitMqUrl } from './core/rabbitmq/rabbitmq-url.helper';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const rmqUrl = buildRabbitMqUrl(configService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'desafios',
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

  const port = configService.get<number>('APP_PORT') ?? 3002;
  await app.listen(port);
}
bootstrap();
