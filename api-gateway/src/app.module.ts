import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EnvConfigModule } from './core/config/env.config';
import { DatabaseModule } from './core/database/database.module';
import { OutboxModule } from './core/outbox/outbox.module';
import { RabbitMQModule } from './core/rabbitmq/rabbitmq.module';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { RolesGuard } from './core/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    EnvConfigModule,
    DatabaseModule,
    OutboxModule,
    RabbitMQModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 10,
      },
    ]),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
