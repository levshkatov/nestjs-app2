import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User, UserTypes } from '../models/user.model';
import { Hobbie } from '../models/hobbie.model';
import { Profile } from '../models/profile.model';
import { UserFriend, FriendshipStatus } from '../models/userFriend.model';
import { UserSubscription } from '../models/userSubscription.model';
import { Includeable } from 'sequelize/types';
import { Event } from '../models/event.model';
import { EventMember, EventMemberState } from '../models/eventMember.model';
import { Op, literal, where, fn, col } from 'sequelize';
import { GetUsersDto } from './dto/get-users.dto';
import { AddRemoveDto } from './dto/add-remove.dto';
import { Permission, PermissionsNames } from '../models/permission.model';
import { CreateAdminDto } from './dto/create-user.dto';
import { City } from '../models/city.model';
import { Photo } from '../models/photo.model';
import { UserAlbumsReqDto, UserPhotosReqDto } from './dto/user-photos.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { eventTypes } from '../events/events.service';
import { PhotoWithAuthorDto } from '../dto/photo.dto';
import { PaginationReqDto } from '../dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,

    @InjectModel(Permission)
    private permissionModel: typeof Permission,

    @InjectModel(UserFriend)
    private friendModel: typeof UserFriend,

    @InjectModel(UserSubscription)
    private subscriptionModel: typeof UserSubscription,

    @InjectModel(Event)
    private eventModel: typeof Event,

    @InjectModel(Photo)
    private photoModel: typeof Photo,

    @InjectModel(EventMember)
    private eventMemberModel: typeof EventMember,

    private notifyService: NotificationsService,

    private config: ConfigService,
  ) {}

  async getUsers({
    cityId,
    gender,
    ageFrom,
    ageTo,
    hobbiesIds,
    isBlocked,
    isDeleted,
    userType,
    search,
    offset,
    limit,
  }: GetUsersDto) {
    const includeArray: Includeable[] = [];
    const filterProfile: any = {};
    const filterUser: any = [{ userType: { [Op.not]: UserTypes.admin } }];
    const filterHobbie: any = {};

    if (cityId) {
      filterProfile.cityId = cityId;
    }

    if (gender) {
      filterProfile.gender = gender;
    }

    if (ageFrom && ageTo) {
      filterProfile.birth = {
        [Op.between]: [literal(`NOW() - INTERVAL '${+ageTo + 1}y'`), literal(`NOW() - INTERVAL '${+ageFrom}y'`)],
      };
    } else if (ageFrom) {
      filterProfile.birth = {
        [Op.lte]: literal(`NOW() - INTERVAL '${+ageFrom}y'`),
      };
    } else if (ageTo) {
      filterProfile.birth = {
        [Op.gte]: literal(`NOW() - INTERVAL '${+ageTo + 1}y'`),
      };
    }

    if (isBlocked !== undefined) {
      filterUser.push({ isBlocked: isBlocked ? true : null });
    }

    if (isDeleted !== undefined) {
      filterUser.push({ deletedAt: isDeleted ? { [Op.not]: null } : null });
    }

    if (userType) {
      filterUser.push({ userType });
    }

    if (search) {
      filterProfile[Op.and] = [
        where(fn('REGEXP_REPLACE', fn('LOWER', fn('CONCAT', col('name'), col('surname'))), '\\s', '', 'g'), {
          [Op.like]: `%${search.replace(/\s/g, '').toLowerCase()}%`,
        }),
      ];
    }

    includeArray.push({
      model: Profile.scope('simple'),
      where: filterProfile,
    });

    if (hobbiesIds) {
      filterHobbie.id = hobbiesIds;
    }

    includeArray.push({
      model: Hobbie,
      where: filterHobbie,
      through: {
        attributes: [],
      },
      required: hobbiesIds ? true : false,
    });

    const users = await this.userModel.unscoped().findAndCountAll({
      attributes: ['id', 'isBlocked', 'createdAt', 'deletedAt', 'userType'],
      where: {
        [Op.and]: filterUser,
      },
      include: includeArray,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
      paranoid: false,
    });

    return {
      count: users.count,
      users: users.rows,
    };
  }

  async getAdmins({ offset, limit }: PaginationReqDto) {
    return await this.userModel.unscoped().findAndCountAll({
      attributes: ['id', 'email', 'userType', 'createdAt'],
      where: {
        userType: UserTypes.admin,
      },
      include: [
        {
          model: Permission,
          attributes: ['id', 'name'],
          through: {
            attributes: [],
          },
        },
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });
  }

  async getUserById(id: number, user: User) {
    const isForeign = id !== user.id;
    let isBlockedYou: boolean;
    let friendshipStatus: FriendshipStatus = 'notFriend';
    let friendsCount: number;
    let subscriptionsCount: number;
    let organizedCount: number;
    let participatedInCount: number;
    let photos = { count: 0, rows: [] };
    let _photos: PhotoWithAuthorDto[];

    if (isForeign && user.userType == UserTypes.user) {
      isBlockedYou = !!(await this.friendModel.findOne({
        where: {
          userId: id,
          friendId: user.id,
          isBlocked: true,
        },
      }));
    }

    const includeArray: Includeable[] = [];
    const userAttributes = isForeign
      ? ['id', 'isBlocked', 'deletedAt']
      : ['id', 'isBlocked', 'deletedAt', 'phone', 'email', 'password'];

    if (isBlockedYou) {
      includeArray.push({
        model: Profile.scope('simple'),
      });
      friendshipStatus = 'blocked';
    } else {
      includeArray.push(
        {
          model: Profile,
          include: [
            {
              model: City,
              attributes: ['id', 'name'],
            },
            {
              model: Photo,
            },
          ],
        },
        {
          model: Hobbie,
          through: { attributes: [] },
        },
      );
    }

    const foundedUser = await this.userModel.unscoped().findOne({
      attributes: userAttributes,
      include: includeArray,
      where: {
        id,
        userType: UserTypes.user,
      },
      paranoid: false,
    });

    if (!foundedUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (foundedUser.isBlocked) {
      if (!user.hasPermissions([PermissionsNames.admin, PermissionsNames.userGet])) {
        throw new NotFoundException('Пользователь заблокирован');
      }
    }

    if (foundedUser.deletedAt) {
      if (!user.hasPermissions([PermissionsNames.admin, PermissionsNames.userGet])) {
        throw new NotFoundException('Пользователь не найден');
      }
    }

    if (!isBlockedYou) {
      subscriptionsCount = await this.subscriptionModel.count({
        where: {
          userId: id,
        },
      });

      organizedCount = await this.eventModel.count({
        where: {
          creatorId: id,
        },
      });

      participatedInCount = await this.eventMemberModel.count({
        where: {
          userId: id,
          state: [EventMemberState.joined, EventMemberState.pending],
          isBlocked: false,
        },
      });

      const whereClause: any = [
        {
          authorId: id,
        },
      ];

      if (id !== user.id && !user.hasPermissions([PermissionsNames.admin, PermissionsNames.userPhotosGet])) {
        whereClause.push({
          [Op.or]: [
            {
              $events$: null,
            },
            {
              '$events.typeId$': {
                [Op.not]: eventTypes['Закрытое событие'],
              },
            },
          ],
        });
      }

      photos = await this.photoModel.findAndCountAll({
        attributes: ['id', 'src', 'blurHash', 'createdAt'],
        subQuery: false,
        where: {
          [Op.and]: whereClause,
        },
        include: [
          {
            model: Event,
            as: 'events',
            attributes: ['id', 'typeId'],
            through: {
              attributes: [],
            },
          },
          {
            model: User,
            as: 'author',
            attributes: ['id', 'userType'],
            include: [
              {
                model: Profile,
                attributes: ['name', 'surname'],
              },
            ],
          },
        ],
        limit: 10,
        order: [['createdAt', 'DESC']],
        distinct: true,
      });

      _photos = photos.rows.map((photo) => {
        const photoJSON: any = photo.toJSON();
        delete photoJSON.events;

        return {
          ...photoJSON,
          author: {
            id: photoJSON.author.id,
            userType: photoJSON.author.userType,
            ...photoJSON.author.profile,
          },
        };
      });

      if (isForeign) {
        const friendRelation = await this.friendModel.findOne({
          where: {
            userId: user.id,
            friendId: id,
          },
        });
        if (friendRelation) {
          if (friendRelation.isAccepted) {
            friendshipStatus = 'friend';
          }
          if (friendRelation.isAccepted === false) {
            friendshipStatus = 'pending';
          }
          if (friendRelation.isBlocked) {
            friendshipStatus = 'youBlocked';
          }
        }
      } else {
        friendsCount = await this.friendModel.count({
          where: {
            userId: user.id,
            isAccepted: true,
          },
        });
      }
    }

    const userJSON = foundedUser.toJSON();
    if (!userJSON.password) {
      userJSON.notHavePassword = true;
    }
    delete userJSON.password;

    return {
      friendshipStatus,
      friendsCount,
      subscriptionsCount,
      organizedCount,
      participatedInCount,
      photosCount: photos.count,
      photos: _photos,
      ...userJSON,
    };
  }

  async getUserPhotos(id: number, { limit, offset }: UserPhotosReqDto, user: User) {
    const whereClause: any = [
      {
        authorId: id,
      },
    ];

    if (id !== user.id && !user.hasPermissions([PermissionsNames.admin, PermissionsNames.userPhotosGet])) {
      whereClause.push({
        [Op.or]: [
          {
            $events$: null,
          },
          {
            '$events.typeId$': {
              [Op.not]: eventTypes['Закрытое событие'],
            },
          },
        ],
      });
    }

    const photos = await this.photoModel.findAndCountAll({
      attributes: ['id', 'src', 'blurHash', 'createdAt'],
      subQuery: false,
      where: {
        [Op.and]: whereClause,
      },
      include: [
        {
          model: Event,
          as: 'events',
          attributes: ['id', 'typeId'],
          through: {
            attributes: [],
          },
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'userType'],
          include: [
            {
              model: Profile,
              attributes: ['name', 'surname'],
            },
          ],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    const _rows: PhotoWithAuthorDto[] = photos.rows.map((photo) => {
      const photoJSON: any = photo.toJSON();
      delete photoJSON.events;

      return {
        ...photoJSON,
        author: {
          id: photoJSON.author.id,
          userType: photoJSON.author.userType,
          ...photoJSON.author.profile,
        },
      };
    });

    return {
      count: photos.count,
      photos: _rows,
    };
  }

  async getUserAlbums(id: number, { limit, offset }: UserAlbumsReqDto, user: User) {
    const whereClause: any = [
      {
        [Op.or]: [
          {
            '$members.id$': id,
            '$members.EventMember.state$': EventMemberState.joined,
            '$members.EventMember.isBlocked$': false,
          },
          {
            creatorId: id,
          },
        ],
      },
    ];

    if (id !== user.id && !user.hasPermissions([PermissionsNames.admin, PermissionsNames.userPhotosGet])) {
      whereClause.push({
        typeId: {
          [Op.not]: eventTypes['Закрытое событие'],
        },
      });
    }

    const { count, rows } = await this.eventModel.findAndCountAll({
      subQuery: false,
      attributes: ['id', 'name', 'startFrom', 'createdAt'],
      where: {
        [Op.and]: whereClause,
      },
      include: [
        {
          model: User,
          as: 'members',
          through: {
            attributes: ['state', 'isBlocked'],
          },
          required: false,
        },
        {
          model: Photo,
          as: 'photo',
        },
      ],
      limit,
      offset,
      order: [
        ['startFrom', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      distinct: true,
    });

    const _rows = rows.map((e) => {
      const eventJSON: any = e.toJSON();

      delete eventJSON.members;
      delete eventJSON.createdAt;

      eventJSON.date = eventJSON.startFrom;
      delete eventJSON.startFrom;

      return eventJSON;
    });

    return {
      count,
      albums: _rows,
    };
  }

  async createAdmin({ email, password, permissions }: CreateAdminDto) {
    const existingUser = await this.userModel.unscoped().findOne({
      attributes: ['id', 'email'],
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь уже существует');
    }

    const user = await this.userModel.create({
      phone: null,
      email,
      password,
      userType: UserTypes.admin,
    });

    const permissionsIds = await this.permissionModel.findAll({
      where: {
        id: permissions,
      },
    });

    await user.$set('permissions', permissionsIds);

    const userJSON = user.toJSON();
    return {
      id: userJSON.id,
      email: userJSON.email,
      userType: userJSON.userType,
      isBlocked: userJSON.isBlocked,
      permission: permissionsIds,
    };
  }

  async addOrRemoveBlock({ targetId, action }: AddRemoveDto, user) {
    if (targetId === user.id) {
      throw new BadRequestException('Нельзя заблокировать пользователя');
    }

    const result = await this.userModel.unscoped().update(
      {
        isBlocked: action ? true : null,
      },
      {
        where: {
          id: targetId,
        },
      },
    );

    if (!result) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (action) {
      this.notifyService
        .sendNotification(targetId, {
          body: 'Вы заблокированы в сервисе',
        })
        .then(({ tokens }) => {
          this.notifyService.removeToken({ fcmToken: tokens }, targetId);
        });

      this.notifyService.sendEmailNotification(targetId, `Вы заблокированы в сервисе`, {
        id: this.config.get('sendpulse.text_mail.template'),
        variables: {
          text: `Вас заблокировали в сервисе. За более подробной информацией обращайтесь в техническую поддержку.`,
        },
      });

      return {
        message: 'Пользователь заблокирован',
      };
    }

    return {
      message: 'Пользователь разблокирован',
    };
  }

  async deleteUser(user: User) {
    await user.destroy();

    return {
      message: 'Аккаунт удален',
    };
  }

  async restoreUser(id: number) {
    await this.userModel.restore({
      where: {
        id,
      },
    });

    return {
      message: 'Аккаунт восстановлен',
    };
  }

  async deleteUserData(id: number) {
    const result = await this.userModel.unscoped().destroy({
      force: true,
      where: {
        id,
      },
    });

    if (!result) {
      throw new NotFoundException('Пользователь не найден');
    }

    return {
      message: 'Данные пользователя удалены',
    };
  }
}
