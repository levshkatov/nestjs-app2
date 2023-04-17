import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { City } from '../models/city.model';
import { Event } from '../models/event.model';
import { User } from '../models/user.model';
import { EventType } from '../models/eventType.model';
import { EventHobbie } from '../models/eventHobbie.model';
import { Hobbie } from '../models/hobbie.model';
import { EventMember } from '../models/eventMember.model';
import { EventComment } from '../models/eventComment.model';
import { EventPhoto } from '../models/eventPhoto.model';
import { EventDate } from '../models/eventDates.model';
import { Profile } from '../models/profile.model';
import { Photo } from '../models/photo.model';
import { EventSchedule } from '../models/eventSchedule.model';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserFriend } from '../models/userFriend.model';
import { EventReview } from '../models/eventReview.model';
import { CrossModule } from '../cross/cross.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Event,
      EventType,
      EventHobbie,
      EventMember,
      EventComment,
      EventPhoto,
      EventDate,
      EventSchedule,
      EventReview,
      Hobbie,
      User,
      City,
      Profile,
      Photo,
      UserFriend,
    ]),
    AuthModule,
    NotificationsModule,
    CrossModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
