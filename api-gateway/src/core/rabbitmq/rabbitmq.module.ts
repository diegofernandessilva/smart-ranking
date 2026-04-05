import { Module } from '@nestjs/common';
import {
  AbstractQueueProvider,
  RabbitMQQueueProvider,
} from './rabbitmq-queue.provider';

@Module({
  providers: [
    {
      provide: AbstractQueueProvider,
      useClass: RabbitMQQueueProvider,
    },
  ],
  exports: [AbstractQueueProvider],
})
export class RabbitMQModule {}
