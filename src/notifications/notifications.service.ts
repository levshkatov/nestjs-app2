import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { messaging } from 'firebase-admin';
import { Includeable, Op, WhereOptions } from 'sequelize';
import { AuthService } from '../auth/auth.service';
import { PaginationReqDto } from '../dto/pagination.dto';
import { Event } from '../models/event.model';
import { EventMember, EventMemberState } from '../models/eventMember.model';
import { Notification } from '../models/notification.model';
import { Photo } from '../models/photo.model';
import { Profile } from '../models/profile.model';
import { Setting, UserSettingNames } from '../models/setting.model';
import { User } from '../models/user.model';
import { UserFcm } from '../models/userFcm.model';
import { UserSubscription } from '../models/userSubscription.model';
import { FcmTokenDto } from './dto/token.dto';

class NotificationParams {
  userId: number;
  type: string;
  text?: string;
  eventId?: number;
  targetUserId?: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(UserFcm)
    private userFcmModel: typeof UserFcm,

    @InjectModel(Notification)
    private notifyModel: typeof Notification,

    @InjectModel(EventMember)
    private eventMemberModel: typeof EventMember,

    @InjectModel(UserSubscription)
    private subscriptionModel: typeof UserSubscription,

    private authService: AuthService,
  ) {}

  public async getEmails(userIds: number | number[], settings?: { [key in keyof typeof UserSettingNames]?: boolean }) {
    const includeArray: Includeable[] = [];

    if (settings) {
      includeArray.push({
        model: Setting,
        where: settings,
        required: true,
      });
    }

    const userWithSettings = await User.unscoped().findAll({
      attributes: ['id', 'email'],
      where: {
        id: userIds,
        email: {
          [Op.ne]: null,
        },
      },
      include: includeArray,
    });

    const emails = userWithSettings.map((u) => ({ name: u.id.toString(), email: u.email }));

    return {
      emails,
    };
  }

  public async getTokens(userIds: number | number[], settings?: { [key in keyof typeof UserSettingNames]?: boolean }) {
    let ids: number[] = userIds as number[];
    if (settings) {
      const userWithSettings = await User.findAll({
        attributes: ['id'],
        where: {
          id: userIds,
        },
        include: [
          {
            model: Setting,
            where: settings,
            required: true,
          },
        ],
      });

      ids = userWithSettings.map((u) => u.id);
    }

    if (!ids.length) {
      return {
        tokens: [],
        users: ids,
      };
    }

    const result = await this.userFcmModel.findAll({
      where: {
        userId: ids,
      },
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    const tokens = result.map((e) => {
      return e.token;
    });

    return {
      tokens,
      users: ids,
    };
  }

  public async checkAndClearTokens(
    tokens: string[],
    response: messaging.MessagingTopicManagementResponse,
  ): Promise<void>;
  public async checkAndClearTokens(tokens: string[], response: messaging.BatchResponse): Promise<void>;
  public async checkAndClearTokens(tokens: string[], response: any) {
    if (response.failureCount && tokens.length) {
      const badTokens = [];

      if (response.responses) {
        response.responses.map((r, index) => {
          if (!r.success) badTokens.push(tokens[index]);
        });
      } else {
        response.errors.map((error) => badTokens.push(tokens[error.index]));
      }

      if (badTokens.length) {
        await this.userFcmModel.destroy({
          where: {
            token: badTokens,
          },
        });
      }
    }
  }

  public async addOrRemoveFromTopic(userIds: number | number[], topic: string, action = true) {
    const { tokens } = await this.getTokens(userIds);
    if (!tokens.length) return;

    const method = action ? 'subscribeToTopic' : 'unsubscribeFromTopic';
    const response = await messaging()[method](tokens, topic);

    this.checkAndClearTokens(tokens, response);
  }

  public async removeMembersFromTopic(eventId: number) {
    const members = await this.eventMemberModel.findAll({
      where: {
        eventId,
      },
      raw: true,
    });

    const usersIds = members.map((m) => m.userId);

    this.addOrRemoveFromTopic(usersIds, `event_${eventId}`);
  }

  async sendEmailNotification(
    userIds: number | number[],
    subject: string,
    template: { id: number; variables?: any },
    settings?: { [key in keyof typeof UserSettingNames]?: boolean },
  ) {
    const { emails } = await this.getEmails(userIds, settings);

    if (!emails.length) return emails;

    this.authService.sendMails(emails, subject, template);
  }

  async sendNotification(
    userIds: number | number[],
    notification: messaging.Notification,
    data?: { [key: string]: string },
    settings?: { [key in keyof typeof UserSettingNames]?: boolean },
  ) {
    const { tokens, users } = await this.getTokens(userIds, settings);

    if (!tokens.length) return { tokens: [], users };

    const chunkSize = 1000;
    if (tokens.length > chunkSize) {
      const tokensCopy = tokens.slice();
      const promises = [];

      for (let i = 0; i < tokens.length; i += chunkSize) {
        const chunkTokens = tokensCopy.slice(i, i + chunkSize);

        promises.push(
          messaging().sendMulticast({
            notification: {
              title: '*',
              ...notification,
            },
            data: {
              ...notification,
              ...data,
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            tokens: chunkTokens,
          }),
        );
      }

      await Promise.all(promises);

      return { tokens, users };
    }

    const message = {
      notification: {
        title: '*',
        ...notification,
      },
      data: {
        ...notification,
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      tokens,
    };

    const response = await messaging().sendMulticast(message);

    this.checkAndClearTokens(tokens, response);

    return { tokens, users };
  }

  async sendNotificationByTopic(topic: string, notification: messaging.Notification, data?: { [key: string]: string }) {
    const message = {
      notification: {
        title: '*',
        ...notification,
      },
      data: {
        ...notification,
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      topic,
    };

    await messaging().send(message);
  }

  async createNotificationForUser(rest: NotificationParams) {
    await this.notifyModel.create({
      ...rest,
    });
  }

  async deleteNotification(where) {
    await this.notifyModel.destroy({ where });
  }

  async createNotificationForUsers(userIds: number[], rest: Partial<NotificationParams>) {
    if (!userIds.length) return;
    const notifications = userIds.map((id) => ({ userId: id, ...rest }));

    await this.notifyModel.bulkCreate(notifications);
  }

  async createNotificationForMembers(eventId: number, rest: Partial<NotificationParams>) {
    const members = await this.eventMemberModel.findAll({
      where: {
        eventId,
        state: EventMemberState.joined,
        isBlocked: false,
      },
    });

    const userIds: number[] = [];
    const notifications = members.map((m) => {
      userIds.push(m.userId);

      return { userId: m.userId, eventId, ...rest };
    });

    await this.notifyModel.bulkCreate(notifications);

    return userIds;
  }

  async createNotificationForFollowers(managerId: number, rest: Partial<NotificationParams>) {
    const followers = await this.subscriptionModel.findAll({
      where: {
        subscriptionId: managerId,
      },
    });

    const notifications = followers.map((m) => ({ userId: m.userId, targetUserId: managerId, ...rest }));

    await this.notifyModel.bulkCreate(notifications);
  }

  async updateNotification(data: any, where: WhereOptions) {
    await this.notifyModel.update(data, { where });
  }

  async getNotifications({ offset, limit }: PaginationReqDto, user: User) {
    const { count, rows } = await this.notifyModel.findAndCountAll({
      where: {
        userId: user.id,
      },
      include: [
        {
          model: Event,
          attributes: ['id', 'name', 'startFrom'],
          include: [
            {
              model: Photo,
              as: 'photo',
            },
          ],
          required: false,
        },
        {
          model: User.unscoped(),
          as: 'targetUser',
          attributes: ['id', 'userType'],
          include: [Profile.scope('simple')],
          required: false,
        },
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    return {
      count,
      notifications: rows,
    };
  }

  async addToken({ fcmToken }: FcmTokenDto, userId: number) {
    await this.userFcmModel.destroy({ where: { token: fcmToken } });
    await this.userFcmModel.create({
      userId: userId,
      token: fcmToken,
    });

    this.eventMemberModel
      .findAll({
        where: {
          userId: userId,
          state: EventMemberState.joined,
          isBlocked: false,
        },
      })
      .then((events) => {
        events.map((e) => messaging().subscribeToTopic(fcmToken, `event_${e.eventId}`));
      });

    this.subscriptionModel
      .findAll({
        where: {
          userId,
        },
      })
      .then((managers) => {
        managers.map((m) => messaging().subscribeToTopic(fcmToken, `manager_${m.subscriptionId}`));
      });
  }

  async removeToken({ fcmToken }: FcmTokenDto, userId: number) {
    if (userId) {
      const result = await this.userFcmModel.destroy({ where: { token: fcmToken } });
      if (!result) return;
    } else {
      const fcm = await this.userFcmModel.findOne({
        where: {
          token: fcmToken,
        },
      });

      if (!fcm) return;

      await fcm.destroy();

      userId = fcm.userId;
    }

    this.eventMemberModel
      .findAll({
        where: {
          userId,
          state: EventMemberState.joined,
        },
      })
      .then((events) => {
        events.map((e) => messaging().unsubscribeFromTopic(fcmToken, `event_${e.eventId}`));
      });

    this.subscriptionModel
      .findAll({
        where: {
          userId,
        },
      })
      .then((managers) => {
        managers.map((m) => messaging().unsubscribeFromTopic(fcmToken, `manager_${m.subscriptionId}`));
      });
  }
}
