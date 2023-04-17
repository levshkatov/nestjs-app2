import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Event } from '../models/event.model';
import { User } from '../models/user.model';
import { NotificationsModule } from '../notifications/notifications.module';
import { CronService } from './cron.service';

@Module({
  imports: [SequelizeModule.forFeature([Event, User]), NotificationsModule],
  // controllers: [],
  providers: [CronService],
})
export class CronModule {}
