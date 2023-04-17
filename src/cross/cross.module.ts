import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { SequelizeModule } from '@nestjs/sequelize';
import { Event } from '../models/event.model';
import { User } from '../models/user.model';
import { NotificationsModule } from '../notifications/notifications.module';
import { CrossController } from './cross.controller';
import { CrossService } from './cross.service';

@Module({
  imports: [SequelizeModule.forFeature([User, Event]), NotificationsModule],
  controllers: [CrossController],
  providers: [
    CrossService,
    /// Chat Microservice Client
    {
      provide: 'CHAT_ONE_SERVICE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.NATS,
          options: {
            name: 'Chat queue',
            url: configService.get('nats.url'),
            queue: configService.get('nats.chatQueue'),
          },
        });
      },
    },
    {
      provide: 'CHAT_ALL_SERVICE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.REDIS,
          options: {
            url: configService.get('redis.url'),
          },
        });
      },
    },
  ],
  exports: [CrossService],
})
export class CrossModule {}
