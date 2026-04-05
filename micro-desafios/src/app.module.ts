import { Module } from '@nestjs/common';
import { EnvConfigModule } from './core/config/env.config';
import { DatabaseModule } from './core/database/database.module';
import { OutboxModule } from './core/outbox/outbox.module';
import { RabbitMQModule } from './core/rabbitmq/rabbitmq.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [EnvConfigModule, DatabaseModule, OutboxModule, RabbitMQModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
