import { BadRequestException, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Profile } from '../models/profile.model';
import { User } from '../models/user.model';
import { AuthModule } from '../auth/auth.module';
import { UserFcm } from '../models/userFcm.model';
import { UserFriend } from '../models/userFriend.model';
import { Hobbie } from '../models/hobbie.model';
import { Setting } from '../models/setting.model';
import { RelationsService } from './relations.service';
import { RelationsController } from './relations.controller';
import { UserSubscription } from '../models/userSubscription.model';
import { Event } from '../models/event.model';
import { EventMember } from '../models/eventMember.model';
import { Permission } from '../models/permission.model';
import { City } from '../models/city.model';
import { Photo } from '../models/photo.model';
import { ManagerRequest } from '../models/managerRequest';
import { ManagersController } from './managers.controller';
import { ManagersService } from './managers.service';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserPermission } from '../models/userPermission.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      Profile,
      City,
      UserFcm,
      UserFriend,
      UserSubscription,
      Hobbie,
      Setting,
      Permission,
      UserPermission,
      Event,
      EventMember,
      Photo,
      ManagerRequest,
    ]),
    AuthModule,
    NotificationsModule,
    MulterModule.register({
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|doc|docx|pptx|txt|jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException('Доступные форматы: pdf, doc, docx, pptx, txt, jpg, jpeg, png, gif'),
            false,
          );
        }

        cb(undefined, true);
      },
      limits: {
        fileSize: 5242880, // 5MB
      },
    }),
  ],
  controllers: [SettingsController, UsersController, RelationsController, ManagersController],
  providers: [UsersService, SettingsService, RelationsService, ManagersService],
})
export class UsersModule {}
