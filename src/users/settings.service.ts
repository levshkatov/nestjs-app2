import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User, UserTypes } from '../models/user.model';
import { EditEmailDto, EditPasswordDto, EditPhoneDto } from './dto/edit.dto';
import { Hobbie } from '../models/hobbie.model';
import { Setting } from '../models/setting.model';
import { EditSettingDto, EditProfileDto } from './dto/edit.dto';
import { Profile } from '../models/profile.model';
import { Permission, PermissionsDescription, PermissionsNames } from '../models/permission.model';
import { City } from '../models/city.model';
import { AuthService } from '../auth/auth.service';
import { PermissionsReqDto } from '../dto/permission.dto';
import { Photo } from '../models/photo.model';
import { ConfigService } from '@nestjs/config';
import { Includeable } from 'sequelize/types';
import { UserPermission } from '../models/userPermission.model';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,

    @InjectModel(Profile)
    private profileModel: typeof Profile,

    @InjectModel(City)
    private cityModel: typeof City,

    @InjectModel(Hobbie)
    private hobbieModel: typeof Hobbie,

    @InjectModel(Setting)
    private settingModel: typeof Setting,

    @InjectModel(Permission)
    private permissionModel: typeof Permission,

    @InjectModel(UserPermission)
    private userPermissionModel: typeof UserPermission,

    @InjectModel(Photo)
    private photoModel: typeof Photo,

    private authService: AuthService,

    private config: ConfigService,
  ) {}

  async getUserSettings(user: User) {
    return await this.settingModel.findByPk(user.id);
  }

  async editProfile(
    {
      birth,
      cityId,
      description,
      school,
      university,
      photoId,
      hobbiesIds,
      surname,
      gender,
      site,
      name,
      email,
      phone,
      contactName,
    }: EditProfileDto,
    user: User,
  ) {
    const isManager = user.userType == UserTypes.manager;
    const includeArray: Includeable[] = [];

    let city: City;
    if (cityId) {
      city = await this.cityModel.findByPk(cityId, {
        attributes: ['id', 'name'],
      });
      if (!city) {
        throw new BadRequestException('Город не найден');
      }
    } else {
      includeArray.push({
        model: City,
        attributes: ['id', 'name'],
      });
    }

    let photo: Photo;
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
    } else {
      includeArray.push({
        model: Photo,
      });
    }

    const profile = await this.profileModel.unscoped().findByPk(user.id, {
      attributes: {
        exclude: isManager
          ? ['surname', 'gender', 'birth']
          : ['contactName', 'ITN', 'PSRN', 'legalAddress', 'legalEntity', 'site'],
      },
      include: includeArray,
    });

    if (isManager) {
      try {
        await user.update({
          phone,
          email,
        });
      } catch (error) {
        throw new ConflictException('Пользователь уже существует');
      }

      await profile.update({
        description,
        cityId: city ? cityId : profile.cityId,
        photoId: photo ? photoId : profile.photoId,
        site,
        name,
        contactName,
      });
    } else {
      await profile.update({
        name,
        surname,
        gender,
        birth,
        description,
        school,
        university,
        cityId: city ? cityId : profile.cityId,
        photoId: photo ? photoId : profile.photoId,
      });
    }

    let hobbies;
    if (hobbiesIds) {
      hobbies = await this.hobbieModel.findAll({
        where: {
          id: hobbiesIds,
        },
      });
      await user.$set('hobbies', hobbies);
    } else {
      hobbies = await user.$get('hobbies');
    }

    profile.setDataValue('city', city || profile.city);
    profile.setDataValue('photo', photo || profile.photo);
    user.setDataValue('hobbies', hobbies);

    const userJSON = user.toJSON();
    delete userJSON.permissions;
    delete userJSON.updatedAt;
    delete userJSON.vkId;
    delete userJSON.firebaseId;

    const profileJSON = profile.toJSON();
    delete profileJSON.userId;
    delete profileJSON.cityId;
    delete profileJSON.photoId;
    delete profileJSON.updatedAt;
    delete profileJSON.createdAt;

    return {
      ...userJSON,
      ...profileJSON,
      isAccepted: isManager ? user.hasPermissions([PermissionsNames.manager]) : undefined,
    };
  }

  async editPassword({ password, confirmPassword, newPassword }: EditPasswordDto, user: User) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    const userPassword = await this.userModel.findByPk(user.id, {
      attributes: ['password'],
    });

    if (user.password) {
      if (password === newPassword) {
        throw new BadRequestException('Новый пароль не должен совпадать со старым');
      }

      if (!userPassword.checkPassword(password)) {
        throw new BadRequestException('Пароль неверный');
      }
    }

    await user.update({ password: newPassword });

    return {
      message: 'Пароль изменен',
    };
  }

  async editPhone({ password, firebaseIdToken }: EditPhoneDto, user: User) {
    const userPassword = await this.userModel.findByPk(user.id, {
      attributes: ['password'],
    });

    if (user.password) {
      if (!userPassword.checkPassword(password)) {
        throw new BadRequestException('Пароль неверный');
      }

      if (!firebaseIdToken) {
        return {
          message: 'Пароль верный',
        };
      }
    }

    const decoded = await this.authService.verifyFirebaseIdToken(firebaseIdToken);

    const isPhoneBusy = await this.userModel.findOne({
      where: {
        phone: decoded.phone_number,
      },
    });

    if (isPhoneBusy) {
      throw new BadRequestException('Этот номер уже занят');
    }

    await user.update({ phone: decoded.phone_number, password });

    return {
      message: 'Номер телефона изменен',
    };
  }

  async editEmail({ email }: EditEmailDto, user: User) {
    const isEmailBusy = await this.userModel.findOne({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (isEmailBusy) {
      throw new BadRequestException('Эта почта уже занята');
    }

    const { resetToken, expireAt } = this.authService.createResetToken();

    try {
      await this.authService.sendMail(email, 'Изменение электронной почты', {
        id: this.config.get('sendpulse.edit_email.template'),
        variables: {
          link: `${this.config.get('sendpulse.edit_email.link')}${resetToken}_${email}`,
          oldEmail: user.email,
          email,
        },
      });
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Ошибка отправки письма изменения электронной почты');
    }

    await user.update({
      resetToken: `${resetToken}_${email}`,
      resetTokenExpireAt: expireAt,
    });

    return {
      message: 'На Вашу новую электронную почту отправлено письмо с подтверждением',
    };
  }

  async editUserSetting({ setting, value }: EditSettingDto, user: User) {
    await this.settingModel.update(
      {
        [setting]: value,
      },
      {
        where: {
          userId: user.id,
        },
      },
    );

    return {
      [setting]: value,
    };
  }

  async getPermissions() {
    return await this.permissionModel.findAll();
  }

  async getUserPermissions(id: number) {
    const user = await this.userModel.unscoped().findByPk(id, {
      attributes: ['id', 'isBlocked'],
    });

    this.authService.checkFoundedUser(user);

    const permissions = await this.userPermissionModel.findAll({
      where: {
        userId: id,
      },
      attributes: [],
      include: [
        {
          model: Permission,
          attributes: ['id', 'name', 'description'],
        },
      ],
    });

    return permissions.map((el) => el.permission);
  }

  async editUserPermissions(id: number, { permissions }: PermissionsReqDto) {
    const user = await this.userModel.unscoped().findByPk(id, {
      attributes: ['id', 'isBlocked'],
    });

    this.authService.checkFoundedUser(user);

    const permissionsIds = await this.permissionModel.findAll({
      where: {
        id: permissions,
      },
    });

    await user.$set('permissions', permissionsIds);

    return {
      message: 'Права пользователя изменены',
    };
  }

  async initPermissions(secret: string) {
    if (secret !== 'Ты_не_пройдешь!') {
      throw new BadRequestException('Мерзкие хоббитцы! Они украли нашу прелесть!');
    }

    // for init permissions => comment next line
    // return { message: 'Не сметь швырять гнома!' };

    const permissions = [];
    for (const name of Object.getOwnPropertyNames(PermissionsDescription)) {
      const description = PermissionsDescription[name];
      permissions.push({
        name,
        description,
      });
    }

    await Permission.bulkCreate(permissions);

    const users = await this.userModel.findAll({
      attributes: ['id', 'userType'],
    });

    const userPermissions = [];
    for (const { id, userType } of users) {
      userPermissions.push({
        userId: id,
        permissionId: userType === UserTypes.user ? 1 : userType === UserTypes.manager ? 2 : 3,
      });
    }

    await UserPermission.bulkCreate(userPermissions);

    return { message: 'Моя собственность. Моя любовь. Моя… моя прелесть' };
  }
}
