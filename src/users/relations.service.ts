import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Profile } from '../models/profile.model';
import { User, UserTypes } from '../models/user.model';
import { Hobbie } from '../models/hobbie.model';
import { Op, Includeable, literal, where, fn, col } from 'sequelize';
import { GetFriendsDto } from './dto/get-friends.dto';
import { UserFriend } from '../models/userFriend.model';
import { UserSubscription } from '../models/userSubscription.model';
import { AddRemoveFriendResponse } from './dto/add-remove.dto';
import { GetSubscriptionsDto } from './dto/get-subscriptions.dto';
import { Photo } from '../models/photo.model';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationActionText, NotificationType } from '../models/notification.model';

@Injectable()
export class RelationsService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,

    @InjectModel(UserFriend)
    private friendModel: typeof UserFriend,

    @InjectModel(UserSubscription)
    private subscriptionModel: typeof UserSubscription,

    private notifyService: NotificationsService,
  ) {}

  async getFriends({ cityId, hobbiesIds, gender, ageFrom, ageTo, search, offset, limit }: GetFriendsDto, user: User) {
    const includeArray: Includeable[] = [];
    const filterProfile: any = {};
    let isGlobal = false;

    if (cityId) {
      filterProfile.cityId = cityId;
      isGlobal = true;
    }

    if (gender) {
      filterProfile.gender = gender;
      isGlobal = true;
    }

    if (ageFrom && ageTo) {
      filterProfile.birth = {
        [Op.between]: [literal(`NOW() - INTERVAL '${+ageTo + 1}y'`), literal(`NOW() - INTERVAL '${+ageFrom}y'`)],
      };
      isGlobal = true;
    }

    if (search && search.length > 2) {
      filterProfile[Op.and] = [
        where(fn('REGEXP_REPLACE', fn('LOWER', fn('CONCAT', col('name'), col('surname'))), '\\s', '', 'g'), {
          [Op.like]: `%${search.replace(/\s/g, '').toLowerCase()}%`,
        }),
      ];
      isGlobal = true;
    }

    includeArray.push({
      model: Profile.scope('simple'),
      where: filterProfile,
    });

    if (hobbiesIds) {
      includeArray.push({
        model: Hobbie,
        attributes: [],
        where: {
          id: hobbiesIds,
        },
      });
      isGlobal = true;
    }

    const friendsFounded = await this.friendModel.findAndCountAll({
      where: {
        userId: user.id,
        isAccepted: true,
        isBlocked: null,
      },
      include: [
        {
          model: User,
          as: 'friend',
          attributes: ['id', 'userType'],
          foreignKey: 'userId',
          include: includeArray,
          required: true,
        },
      ],
      // limit: isGlobal ? null : limit,
      // offset: isGlobal ? null : offset,
      order: [['createdAt', 'DESC']],
    });

    if (isGlobal == false) {
      return {
        friends: friendsFounded.rows.map((f) => f.friend),
        friendsCount: friendsFounded.count,
      };
    }

    const friendsIds: number[] = friendsFounded.rows.map((f) => f.friend.id);
    friendsIds.push(user.id);

    const usersFounded = await this.userModel.findAndCountAll({
      attributes: ['id', 'userType', 'createdAt'],
      where: {
        id: {
          [Op.not]: friendsIds,
        },
      },
      include: includeArray,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      friends: friendsFounded.rows.map((f) => f.friend),
      friendsCount: friendsFounded.count,
      users: usersFounded.rows,
      usersCount: usersFounded.count,
    };
  }

  async getBlocked(user: User) {
    const blockedFound = await this.friendModel.findAll({
      where: {
        userId: user.id,
        isBlocked: true,
      },
      include: [
        {
          model: User,
          as: 'friend',
          attributes: ['id', 'userType'],
          foreignKey: 'userId',
          include: [Profile.scope('simple')],
          required: true,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return blockedFound.map((f) => f.friend);
  }

  async getSubscriptions({ userId, offset, limit }: GetSubscriptionsDto, user: User) {
    let whereCondition;
    let type: string;
    let target: User;

    if (userId) {
      target = await this.userModel.findByPk(userId, {
        attributes: ['id', 'userType'],
      });

      if (!target) {
        throw new NotFoundException('Пользователь не найден');
      }
    }

    if ((target && target.userType == UserTypes.manager) || (user.userType == UserTypes.manager && !userId)) {
      whereCondition = {
        subscriptionId: userId || user.id,
      };
      type = 'user';
    } else {
      whereCondition = {
        userId: userId || user.id,
      };
      type = 'subscription';
    }

    const subscriptionsFounded = await this.subscriptionModel.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: type,
          attributes: ['id', 'userType'],
          include: [
            {
              model: Profile,
              attributes: ['name', 'surname', 'photoId'],
              include: [
                {
                  model: Photo,
                  as: 'photo',
                },
              ],
            },
          ],
          required: true,
        },
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    const subscriptions = subscriptionsFounded.rows.map((s) => s[type]);

    return {
      count: subscriptionsFounded.count,
      subscriptions: subscriptions,
    };
  }

  async addFriend(targetId: number, user: User): Promise<AddRemoveFriendResponse> {
    const friend = await this.userModel.findOne({
      attributes: ['id'],
      where: {
        id: targetId,
        userType: UserTypes.user,
      },
    });

    if (!friend) {
      throw new BadRequestException('Нельзя добавить пользователя в друзья');
    }

    /* 
			Твоя заявка
		 */
    const isYouHaveFriend = await this.friendModel.findOne({
      where: {
        userId: user.id,
        friendId: targetId,
      },
    });

    if (isYouHaveFriend) {
      if (isYouHaveFriend.isBlocked) {
        throw new BadRequestException('Нельзя добавить пользователя в друзья');
      }

      if (isYouHaveFriend.isAccepted === true) {
        return {
          message: 'Вы уже друзья',
          friendshipStatus: 'friend',
        };
      }
      if (isYouHaveFriend.isAccepted === false) {
        return {
          message: 'Заявка в друзья уже отправлена',
          friendshipStatus: 'pending',
        };
      }
    }

    /* 
			Данные заявки твоего друга
		 */
    const isFriendRequestSended = await this.friendModel.findOne({
      where: {
        userId: targetId,
        friendId: user.id,
      },
    });

    if (isFriendRequestSended && isFriendRequestSended.isBlocked) {
      throw new BadRequestException('Нельзя добавить пользователя в друзья');
    }

    /* 
			Если друг уже выслал заявку и ожидает нашего подтверждения (isAccepted === false) то подтверждаем
		 */
    if (isFriendRequestSended && isFriendRequestSended.isAccepted === false) {
      if (isYouHaveFriend) {
        await this.friendModel.update(
          {
            isAccepted: true,
          },
          {
            where: {
              userId: user.id,
              friendId: targetId,
            },
          },
        );
      } else {
        await this.friendModel.create({
          userId: user.id,
          friendId: targetId,
          isAccepted: true,
          isBlocked: null,
        });
      }

      await this.friendModel.update(
        {
          isAccepted: true,
        },
        {
          where: {
            userId: targetId,
            friendId: user.id,
          },
        },
      );

      const targetProfile = await Profile.findByPk(user.id, {
        attributes: ['name', 'surname'],
      });

      this.notifyService.sendNotification(
        targetId,
        {
          body: `${targetProfile.name} ${targetProfile.surname} теперь Ваш друг.`,
        },
        {
          type: 'friendAccepted',
          targetUserId: targetId.toString(),
        },
      );

      this.notifyService.createNotificationForUser({
        userId: targetId,
        type: 'friendAccepted',
        targetUserId: user.id,
      });

      this.notifyService.updateNotification(
        {
          actionText: NotificationActionText.accepted,
        },
        {
          userId: user.id,
          targetUserId: targetId,
          actionText: null,
          type: NotificationType.friendRequest,
        },
      );

      return {
        message: 'Добавлено к друзьям',
        friendshipStatus: 'friend',
      };
    } else {
      /* 
				Отправляем заявку своему другу на подтверждение
			 */
      if (isYouHaveFriend) {
        await this.friendModel.update(
          {
            isAccepted: false,
          },
          {
            where: {
              userId: user.id,
              friendId: targetId,
            },
          },
        );
      } else {
        await this.friendModel.create({
          userId: user.id,
          friendId: targetId,
          isAccepted: false,
          isBlocked: null,
        });
      }

      const userProfile = await Profile.findByPk(user.id, {
        attributes: ['name', 'surname'],
      });

      this.notifyService.sendNotification(
        targetId,
        {
          body: `Заявка в друзья от ${userProfile.name} ${userProfile.surname}`,
        },
        {
          type: NotificationType.friendRequest,
          targetUserId: user.id.toString(),
        },
      );

      this.notifyService.createNotificationForUser({
        userId: targetId,
        type: NotificationType.friendRequest,
        targetUserId: user.id,
      });

      return {
        message: 'Заявка в друзья отправлена',
        friendshipStatus: 'pending',
      };
    }
  }

  async removeFriend(targetId: number, user: User) {
    /* 
			Удаляем из друзей если уже были друзьями 
		*/
    await this.friendModel.update(
      {
        isAccepted: null,
      },
      {
        where: {
          [Op.or]: [
            {
              userId: user.id,
              friendId: targetId,
            },
            {
              userId: targetId,
              friendId: user.id,
            },
          ],
        },
      },
    );

    this.notifyService.updateNotification(
      {
        actionText: NotificationActionText.declined,
      },
      {
        userId: user.id,
        targetUserId: targetId,
        actionText: null,
        type: NotificationType.friendRequest,
      },
    );

    return {
      message: 'Удалено из друзей',
      friendshipStatus: 'notFriend',
    };
  }

  async addBlock(targetId: number, user: User) {
    const targetUser = await this.userModel.findOne({
      attributes: ['id', 'userType'],
      where: {
        id: targetId,
      },
    });

    if (!targetUser) {
      throw new BadRequestException('Нельзя добавить пользователя в черный список');
    }

    const isYouHaveUser = await this.friendModel.findOne({
      where: {
        userId: user.id,
        friendId: targetId,
      },
    });

    if (isYouHaveUser) {
      await isYouHaveUser.update({
        isAccepted: null,
        isBlocked: true,
      });
    } else {
      await this.friendModel.create({
        userId: user.id,
        friendId: targetId,
        isAccepted: null,
        isBlocked: true,
      });
    }

    if ([targetUser.userType, user.userType].includes(UserTypes.manager)) {
      await this.subscriptionModel.destroy({
        where: {
          [Op.or]: [
            {
              userId: user.id,
              subscriptionId: targetId,
            },
            {
              userId: targetId,
              subscriptionId: user.id,
            },
          ],
        },
      });
      if (targetUser.userType == UserTypes.manager) {
        this.notifyService.addOrRemoveFromTopic(user.id, `manager_${targetId}`, false);
      } else {
        this.notifyService.addOrRemoveFromTopic(targetId, `manager_${user.id}`, false);
      }
    } else {
      await this.friendModel.update(
        {
          isAccepted: false,
        },
        {
          where: {
            userId: targetId,
            friendId: user.id,
            isAccepted: true,
          },
        },
      );
    }

    return {
      message: 'Пользователя добавлено в черный список',
    };
  }

  async removeBlock(targetId: number, user: User) {
    await this.friendModel.update(
      {
        isBlocked: null,
      },
      {
        where: {
          userId: user.id,
          friendId: targetId,
        },
      },
    );

    return {
      message: 'Пользователь удален из черного списка',
    };
  }

  async addSubscription(targetId: number, user: User) {
    const subscribeUser = await this.userModel.findOne({
      attributes: ['id'],
      where: {
        id: targetId,
        userType: UserTypes.manager,
      },
    });

    const isUserBlockYou = await this.friendModel.findOne({
      where: {
        userId: targetId,
        friendId: user.id,
        isBlocked: true,
      },
    });

    if (!subscribeUser || isUserBlockYou) {
      throw new BadRequestException('Нельзя подписаться на пользователя');
    }

    const isYouHaveSubsc = await this.subscriptionModel.findOne({
      where: {
        userId: user.id,
        subscriptionId: targetId,
      },
    });

    if (!isYouHaveSubsc) {
      await this.subscriptionModel.create({
        userId: user.id,
        subscriptionId: targetId,
      });
    }

    this.notifyService.addOrRemoveFromTopic(user.id, `manager_${targetId}`);

    return {
      message: 'Добавлено в подписки',
    };
  }

  async removeSubscription(targetId: number, user: User) {
    await this.subscriptionModel.destroy({
      where: {
        userId: user.id,
        subscriptionId: targetId,
      },
    });

    this.notifyService.addOrRemoveFromTopic(user.id, `manager_${targetId}`, false);

    return {
      message: 'Удалено из подписок',
    };
  }
}
