import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CrossService } from './cross.service';
import { InjectModel } from '@nestjs/sequelize';
import { Event } from '../models/event.model';
import { Photo } from '../models/photo.model';
import { Profile } from '../models/profile.model';
import { User } from '../models/user.model';
import { NotificationsService } from '../notifications/notifications.service';

export class CrossNotifyDto {
  ids: number | number[];
  body: string;
  data: any;
}

@Controller()
export class CrossController {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,

    @InjectModel(Event)
    private eventModel: typeof Event,

    private notifyService: NotificationsService,

    private crossService: CrossService,
  ) { }

  @MessagePattern({ cmd: 'back.getUserById' })
  async back_getUserById(id: number) {
    const user = await this.userModel.findByPk(id, {
      attributes: ['id', 'userType'],
      include: [Profile.scope('simple')],
    });

    return user?.toJSON();
  }

  @MessagePattern({ cmd: 'back.getEventById' })
  async back_getEventById(id: number) {
    const event = await this.eventModel.findByPk(id, {
      attributes: ['id', 'name', 'creatorId', 'photoId', 'startFrom', 'finishTo'],
      include: [
        {
          model: Photo,
          as: 'photo',
        },
      ],
    });

    return event;
  }

  @MessagePattern({ cmd: 'back.notifyUsers' })
  async back_notifyUsers({ ids, body, data }: CrossNotifyDto): Promise<boolean> {
    await this.notifyService.sendNotification(ids, { body }, data);
    return true;
  }
}
