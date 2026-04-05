import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';

export const TOPIC_EXCHANGE = 'smartranking.events';

export abstract class AbstractQueueProvider {
  abstract emit(routingKey: string, payload: unknown): Promise<void>;
  abstract send<T>(pattern: string, payload: unknown): Promise<T>;
}

@Injectable()
export class RabbitMQQueueProvider
  extends AbstractQueueProvider
  implements OnModuleDestroy
{
  private readonly logger = new Logger(RabbitMQQueueProvider.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: amqp.ChannelWrapper;

  constructor(private readonly configService: ConfigService) {
    super();

    const rmqUser = this.configService.get<string>('RABBITMQ_USER');
    const rmqPass = this.configService.get<string>('RABBITMQ_PASSWORD');
    const rmqHost = this.configService.get<string>('RABBITMQ_HOST');
    const rmqPort = this.configService.get<number>('RABBITMQ_PORT');
    const rmqVhost = this.configService.get<string>('RABBITMQ_VHOST');
    const rmqUrl = `amqp://${rmqUser}:${rmqPass}@${rmqHost}:${rmqPort}/${rmqVhost}`;

    this.connection = amqp.connect([rmqUrl]);

    this.connection.on('connect', () => {
      this.logger.log('RabbitMQ connected');
    });

    this.connection.on('disconnect', (err: Error) => {
      this.logger.warn(`RabbitMQ disconnected: ${err.message}`);
    });

    this.channelWrapper = this.connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(TOPIC_EXCHANGE, 'topic', {
          durable: true,
        });
        this.logger.log(
          `Topic Exchange "${TOPIC_EXCHANGE}" declared successfully`,
        );
      },
    });
  }

  async emit(routingKey: string, payload: unknown): Promise<void> {
    const message = Buffer.from(JSON.stringify(payload));
    await this.channelWrapper.publish(TOPIC_EXCHANGE, routingKey, message, {
      persistent: true,
      contentType: 'application/json',
    });
    this.logger.debug(
      `Event emitted: ${routingKey} → ${JSON.stringify(payload).substring(0, 200)}`,
    );
  }

  async send<T>(_pattern: string, _payload: unknown): Promise<T> {
    throw new Error(
      'RPC send() not implemented via Topic Exchange. Use NestJS ClientProxy for RPC patterns.',
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.channelWrapper.close();
    await this.connection.close();
    this.logger.log('RabbitMQ connection closed');
  }
}
