import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User, UserTypes } from '../models/user.model';
import { Hobbie } from '../models/hobbie.model';
import { Profile } from '../models/profile.model';
import { UserFriend } from '../models/userFriend.model';
import { SubscriptionStatus, UserSubscription } from '../models/userSubscription.model';
import { Includeable } from 'sequelize/types';
import { Event } from '../models/event.model';
import { SendManagerRequestDto } from './dto/create-user.dto';
import { City } from '../models/city.model';
import { Photo } from '../models/photo.model';
import { ConfigService } from '@nestjs/config';
import { ManagerRequest, ManagerRequestStatus } from '../models/managerRequest';
import { GetManagerRequestsDto } from './dto/get-users.dto';
import { EditManagerRequestDto } from './dto/edit.dto';
import { Permission, PermissionsNames } from '../models/permission.model';
import { AuthService } from '../auth/auth.service';
import { Op } from 'sequelize';
import * as EasyYandexS3 from 'easy-yandex-s3';

@Injectable()
export class ManagersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,

    @InjectModel(Profile)
    private profileModel: typeof Profile,

    @InjectModel(Permission)
    private permissionModel: typeof Permission,

    @InjectModel(Hobbie)
    private hobbieModel: typeof Hobbie,

    @InjectModel(UserFriend)
    private friendModel: typeof UserFriend,

    @InjectModel(UserSubscription)
    private subscriptionModel: typeof UserSubscription,

    @InjectModel(Event)
    private eventModel: typeof Event,

    @InjectModel(Photo)
    private photoModel: typeof Photo,

    @InjectModel(City)
    private cityModel: typeof City,

    @InjectModel(ManagerRequest)
    private managerRequestModel: typeof ManagerRequest,

    private authService: AuthService,

    private config: ConfigService,
  ) {}

  private s3 = new EasyYandexS3({
    auth: {
      accessKeyId: this.config.get('s3.access_key_id'),
      secretAccessKey: this.config.get('s3.secret_access_key'),
    },
    Bucket: this.config.get('s3.bucket_name'),
  });

  async getManagerById(id: number, user: User) {
    const isForeign = id !== user.id;
    const includeArray: Includeable[] = [];
    let subscriptionStatus: SubscriptionStatus = 'notSubscribed';
    let friends: number;

    let profileScope = 'manager';
    if (!isForeign || user.hasPermissions([PermissionsNames.admin, PermissionsNames.managerGet])) {
      profileScope = 'managerFull';
    }

    includeArray.push(
      {
        model: Profile.scope(profileScope),
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

    const foundedUser = await this.userModel.unscoped().findOne({
      attributes: {
        exclude: ['password', 'resetToken', 'resetTokenExpireAt', 'updatedAt'],
      },
      where: {
        id,
        userType: UserTypes.manager,
      },
      include: includeArray,
    });

    if (!foundedUser) {
      throw new NotFoundException('Организатор не найден');
    }

    if (foundedUser.isBlocked) {
      if (!user.hasPermissions([PermissionsNames.admin, PermissionsNames.managerGet])) {
        throw new NotFoundException('Организатор заблокирован');
      }
    }

    // если запрос с другого пользователя
    if (isForeign) {
      /* Друзей в подписках */
      const friendsFounded = await this.friendModel.findAll({
        attributes: ['friendId'],
        where: {
          userId: user.id,
          isAccepted: true,
          isBlocked: null,
        },
      });
      const friendsIds: number[] = friendsFounded.map((f) => f.friendId);

      friends = await this.subscriptionModel.count({
        where: {
          userId: friendsIds,
          subscriptionId: id,
        },
      });

      /* Проверка подписаны ли */
      const subscriptionRelation = await this.subscriptionModel.count({
        where: {
          userId: user.id,
          subscriptionId: id,
        },
      });

      if (subscriptionRelation) subscriptionStatus = 'subscribed';

      /* Блокировка в ЧС */
      const youBlocked = await this.friendModel.findOne({
        where: {
          userId: user.id,
          friendId: id,
          isBlocked: true,
        },
      });
      if (youBlocked) subscriptionStatus = 'youBlocked';

      const blocked = await this.friendModel.findOne({
        where: {
          userId: id,
          friendId: user.id,
          isBlocked: true,
        },
      });

      if (blocked) {
        subscriptionStatus = 'blocked';

        const userJSON = foundedUser.toJSON();
        return {
          subscriptionStatus,
          name: userJSON.name,
          photo: userJSON.photo,
        };
      }
    }

    const organized = await this.eventModel.count({
      where: {
        creatorId: id,
      },
    });

    const photos = await this.photoModel.findAndCountAll({
      attributes: ['id', 'src', 'blurHash', 'createdAt'],
      where: { authorId: id },
      include: [
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
    });

    const _photos = photos.rows.map((photo) => {
      const photoJSON: any = photo.toJSON();

      return {
        ...photoJSON,
        author: {
          id: photoJSON.author.id,
          userType: photoJSON.author.userType,
          ...photoJSON.author.profile,
        },
      };
    });

    const subscribers = await this.subscriptionModel.count({
      where: {
        subscriptionId: id,
      },
    });

    const userJSON = foundedUser.toJSON();

    return {
      subscriptionStatus,
      organized,
      subscribers,
      friends,
      photosCount: photos.count,
      photos: _photos,
      isAccepted: isForeign ? undefined : user.hasPermissions([PermissionsNames.manager]),
      ...userJSON,
    };
  }

  async getManagerRequests({ status, cityId, dateFrom, dateTo, hobbiesIds, offset, limit }: GetManagerRequestsDto) {
    const filter: any = {};
    const filterCity: any = {};
    const filterHobbie: any = {};

    if (status) {
      filter.status = status;
    }
    if (dateFrom && dateTo) {
      filter.createdAt = {
        [Op.between]: [dateFrom, dateTo],
      };
    } else if (dateFrom) {
      filter.createdAt = {
        [Op.gte]: dateFrom,
      };
    } else if (dateTo) {
      filter.createdAt = {
        [Op.lte]: dateTo,
      };
    }
    if (hobbiesIds) {
      filterHobbie.id = hobbiesIds;
    }
    if (cityId) {
      filterCity.cityId = cityId;
    }

    const requests = await this.managerRequestModel.findAndCountAll({
      where: filter,
      include: [
        {
          model: User,
          include: [
            {
              model: Profile.scope('managerFull'),
              attributes: {
                include: ['cityId'],
              },
              where: filterCity,
              include: [
                {
                  model: City,
                  attributes: ['id', 'name'],
                  required: true,
                },
                {
                  model: Photo,
                },
              ],
            },
            {
              model: Hobbie,
              where: filterHobbie,
              through: { attributes: [] },
              required: hobbiesIds ? true : false,
            },
          ],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    const requestsJSON = requests.rows.map((r) => {
      const request: any = r.toJSON();
      return {
        ...request,
        user: r.user.toJSON(),
      };
    });

    return {
      count: requests.count,
      requests: requestsJSON,
    };
  }

  async sendManagerRequest(
    {
      phone,
      name,
      contactName,
      ITN,
      PSRN,
      legalAddress,
      legalEntity,
      site,
      cityId,
      photoId,
      hobbiesIds,
    }: SendManagerRequestDto,
    file,
    user: User,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не выбран');
    }

    if (user.userType !== UserTypes.manager) {
      throw new ForbiddenException('Вы не можете подать заявку');
    }

    const existingUser = await this.userModel.findOne({
      where: { phone },
    });

    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictException('Пользователь с этим телефоном уже существует');
    }

    const existingRequest = await this.managerRequestModel.findOne({
      where: {
        userId: user.id,
      },
      order: [['createdAt', 'DESC']],
    });

    if (existingRequest) {
      if (![ManagerRequestStatus.canceled, ManagerRequestStatus.accepted].includes(existingRequest.status)) {
        throw new BadRequestException('Заявка обрабатывается');
      } else if (existingRequest.status == ManagerRequestStatus.accepted) {
        throw new BadRequestException('Заявка уже принята');
      }
    }

    if (!(await this.cityModel.findByPk(cityId))) {
      throw new BadRequestException('Город не найден');
    }

    let photo;
    if (photoId) {
      photo = await this.photoModel.findOne({
        where: {
          id: photoId,
          authorId: user.id,
        },
        attributes: ['id', 'src', 'blurHash', 'createdAt'],
      });
      if (!photo) {
        throw new BadRequestException('Фотография не найдена');
      }
    }

    await user.update({
      phone,
    });

    await this.profileModel.update(
      {
        name,
        contactName,
        ITN,
        PSRN,
        legalAddress,
        legalEntity,
        site,
        cityId,
        photoId: photo ? photo.id : null,
      },
      {
        where: {
          userId: user.id,
        },
      },
    );

    if (hobbiesIds) {
      const hobbies = await this.hobbieModel.findAll({
        where: {
          id: hobbiesIds,
        },
      });

      user.$set('hobbies', hobbies);
    }

    const filename = Date.now() + '_' + file.originalname.toLowerCase().replace(/[\s]/g, '_');

    const { Location: fileSrc } = await this.s3.Upload({ buffer: file.buffer, name: filename }, '/manager');

    await this.managerRequestModel.create({
      userId: user.id,
      file: fileSrc,
    });

    return {
      message: 'Заявка отправлена',
    };
  }

  async editManagerRequest(id: number, { status }: EditManagerRequestDto) {
    const request = await this.managerRequestModel.findByPk(id);

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if ([ManagerRequestStatus.canceled, ManagerRequestStatus.accepted].includes(request.status)) {
      throw new BadRequestException('Заявка уже обработана');
    }

    request.status = status;
    await request.save();

    if ([ManagerRequestStatus.canceled, ManagerRequestStatus.accepted].includes(status)) {
      const user = await this.userModel.findByPk(request.userId, {
        include: [Profile.scope('manager')],
      });

      const permission = await this.permissionModel.findOne({
        where: {
          name: PermissionsNames.manager,
        },
      });

      await user.$set('permissions', permission);
      try {
        await this.authService.sendMail(user.email, 'Заявка организатора', {
          id: this.config.get(`sendpulse.manager_request_${status}.template`),
          variables: {
            name: user.profile.name,
          },
        });
      } catch (error) {
        console.error(error);
      }

      return {
        message: `Статус изменен на ${status} и отправлено письмо организатору`,
      };
    }

    return {
      message: `Статус изменен на ${status}`,
    };
  }
}
