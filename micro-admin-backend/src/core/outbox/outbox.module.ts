import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { OutboxEvent, OutboxEventSchema } from './outbox-event.schema';
import {
  AbstractOutboxRepository,
  MongooseOutboxRepository,
} from './outbox.repository';
import { OutboxWorkerService } from './outbox-worker.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: OutboxEvent.name, schema: OutboxEventSchema },
    ]),
    RabbitMQModule,
  ],
  providers: [
    {
      provide: AbstractOutboxRepository,
      useClass: MongooseOutboxRepository,
    },
    OutboxWorkerService,
  ],
  exports: [AbstractOutboxRepository],
})
export class OutboxModule {}
