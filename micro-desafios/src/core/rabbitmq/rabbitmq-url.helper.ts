import { ConfigService } from '@nestjs/config';

export function buildRabbitMqUrl(configService: ConfigService): string {
  const user = configService.get<string>('RABBITMQ_USER');
  const pass = configService.get<string>('RABBITMQ_PASSWORD');
  const host = configService.get<string>('RABBITMQ_HOST');
  const port = configService.get<number>('RABBITMQ_PORT');
  const vhost = configService.get<string>('RABBITMQ_VHOST');
  return `amqp://${user}:${pass}@${host}:${port}/${vhost}`;
}
