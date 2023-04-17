import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Event, EventState } from '../models/event.model';
import { literal, Op } from 'sequelize';
import { User } from '../models/user.model';
import { EventMemberState } from '../models/eventMember.model';
import { UserSettingNames } from '../models/setting.model';
import * as moment from 'moment';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../models/notification.model';
import { Profile } from '../models/profile.model';
import { eventTypes } from '../events/events.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CronService {
  constructor(
    @InjectModel(Event)
    private eventModel: typeof Event,

    @InjectModel(User)
    private userModel: typeof User,

    private config: ConfigService,

    private notifyService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE) // Запустится не через минуту от запуска программы, а ровно в 0 секунд каждой минуты
  async finishEvents() {
    const events = await this.eventModel.findAll({
      attributes: ['id', 'name', 'typeId'],
      where: {
        [Op.and]: [
          {
            finishTo: {
              [Op.lte]: Date.now(),
            },
          },
          {
            state: EventState.actual,
          },
        ],
      },
      raw: true,
    });

    if (!events.length) return;

    const eventIds = await Promise.all(
      events.map(
        async (e: Event & { typeId: number }): Promise<number> => {
          const type =
            e.typeId === eventTypes['Афиша'] ? NotificationType.eventReviewWithText : NotificationType.eventReview;

          const userIds = await this.notifyService.createNotificationForMembers(e.id, {
            type,
          });

          this.notifyService.sendNotification(
            userIds,
            {
              body: `Пожалуйста, оцените событие ${e.name}`,
            },
            {
              type,
              eventId: e.id.toString(),
              eventName: e.name,
            },
            {
              pushRemindOnFinish: true,
            },
          );

          this.notifyService.sendEmailNotification(
            userIds,
            'Пожалуйста, оцените событие',
            {
              id: this.config.get('sendpulse.text_mail.template'),
              variables: {
                text: `Событие "${e.name}" завершилось, пожалуйста оставьте отзыв.`,
              },
            },
            {
              emailRemindOnFinish: true,
            },
          );

          return e.id;
        },
      ),
    );

    await this.eventModel.update(
      {
        state: EventState.finished,
      },
      {
        where: {
          id: eventIds,
        },
      },
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async remindAbountEvents() {
    const events = await this.eventModel.findAll({
      attributes: ['id', 'name', 'startFrom'],
      where: {
        state: EventState.actual,
        [Op.or]: [
          literal(`DATE("startFrom") = DATE(NOW() + INTERVAL '1day')`),
          literal(`DATE("startFrom") = DATE(NOW() + INTERVAL '3day')`),
        ],
      },
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id'],
          through: {
            attributes: [],
            where: {
              state: EventMemberState.joined,
              isBlocked: false,
            },
          },
        },
      ],
    });

    await Promise.all(
      events.map(async (e) => {
        let settingName: UserSettingNames = UserSettingNames.pushRemindOneDay;
        let text = 'остался 1 день';

        if (moment(e.startFrom).isSame(moment().add(3, 'days'), 'days')) {
          settingName = UserSettingNames.pushRemindTreeDays;
          text = 'осталось 3 дня';
        }

        const members = e.members.map((m) => m.id);

        const { users } = await this.notifyService.sendNotification(
          members,
          {
            body: `До начала события ${e.name} ${text}`,
          },
          {
            type: NotificationType.eventText,
            eventId: e.id.toString(),
          },
          {
            [settingName]: true,
          },
        );

        await this.notifyService.createNotificationForUsers(users, {
          text: `До начала события ${text}`,
          eventId: e.id,
          type: NotificationType.eventText,
        });

        await this.notifyService.sendEmailNotification(
          members,
          `До начала события ${text}`,
          {
            id: this.config.get('sendpulse.text_mail.template'),
            variables: {
              text: `До начала события "${e.name}" ${text}.`,
            },
          },
          {
            [settingName]: true,
          },
        );
      }),
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async birthdayNotify() {
    const birthdays = await this.userModel.findAll({
      attributes: ['id'],
      include: [
        {
          model: Profile,
          attributes: ['userId', 'birth', 'name', 'surname'],
          where: {
            birth: moment().format('YYYY-MM-DD'),
          },
          required: true,
        },
        {
          model: User,
          as: 'friends',
          attributes: ['id'],
          through: {
            attributes: [],
            where: {
              isAccepted: true,
              isBlocked: null,
            },
          },
        },
      ],
    });

    birthdays.map(async (u) => {
      const friendsIds = u.friends.map((f) => f.id);

      this.notifyService.sendNotification(
        friendsIds,
        {
          body: `У ${u.profile.name} ${u.profile.surname} сегодня День рождения`,
        },
        {
          type: NotificationType.birthday,
          targetUseId: u.id.toString(),
        },
      );

      this.notifyService.createNotificationForUsers(friendsIds, {
        targetUserId: u.id,
        type: NotificationType.birthday,
      });
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async destroySoftDeletedUsers() {
    await this.userModel.unscoped().destroy({
      force: true,
      where: {
        deletedAt: {
          [Op.lte]: moment().subtract(6, 'months').format(),
        },
      },
    });
  }
}
