import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { EventMember } from '../models/eventMember.model';
import { Notification } from '../models/notification.model';
import { UserFcm } from '../models/userFcm.model';
import { UserSubscription } from '../models/userSubscription.model';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule, SequelizeModule.forFeature([UserFcm, Notification, EventMember, UserSubscription])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
