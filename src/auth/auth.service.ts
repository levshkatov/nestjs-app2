import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SignInCredentialsDto } from './dto/signIn-credentials.dto';
import { SignUpCredentialsDto } from './dto/signUp-credentials.dto';
import { SignFirebaseDto, SignVkDto } from './dto/social-credentials.dto';
import { SignUpManagerDto } from './dto/signUp-manager.dto';
import { ResetPasswordEmailDto, ResetPasswordEmailVerifyDto, ResetPasswordPhoneDto } from './dto/reset-password.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';
import { User, UserTypes } from '../models/user.model';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Profile } from '../models/profile.model';
import { auth } from 'firebase-admin';
import { Hobbie } from '../models/hobbie.model';
import { Permission, PermissionsNames } from '../models/permission.model';
import { City } from '../models/city.model';
import { Setting } from '../models/setting.model';
import * as sendpulse from 'sendpulse-api';
import * as easyvk from 'easyvk';
import { ConfigService } from '@nestjs/config';
import { EditEmailVerifyDto } from './dto/edit-email.dto';

@Injectable()
export class AuthService {
  private vk: any;

  constructor(
    @InjectModel(User)
    private userModel: typeof User,

    @InjectModel(Profile)
    private profileModel: typeof Profile,

    @InjectModel(Setting)
    private settingModel: typeof Setting,

    @InjectModel(City)
    private cityModel: typeof City,

    @InjectModel(Hobbie)
    private hobbieModel: typeof Hobbie,

    @InjectModel(Permission)
    private permissionModel: typeof Permission,

    private jwtService: JwtService,

    private config: ConfigService,
  ) {
    sendpulse.init(this.config.get('sendpulse.id'), this.config.get('sendpulse.secret'), 'dist/sendpulse/', (data) => {
      if (data && data.is_error) {
        throw new Error(`Sendpulse error: ${data.message}`);
      }
    });

    easyvk({
      clientId: this.config.get('vk.id'),
      clientSecret: this.config.get('vk.secret'),
      save: false,
    }).then((data) => (this.vk = data));
  }

  private createJWToken(
    user: Partial<User>,
    needMoreInfo?: boolean,
    userInfo?: any,
  ): { accessToken: string; user: Partial<User>; needMoreInfo?: boolean } {
    const payload: JwtPayload = {
      id: user.id,
    };
    const accessToken = this.jwtService.sign(payload);
    user.setDataValue('password', '');

    return {
      accessToken,
      user: {
        id: user.id,
        userType: user.userType,
        ...userInfo,
      },
      needMoreInfo,
    };
  }

  private phoneNumberTransform(phone: string) {
    return phone.replace(/-|_|\/|\(|\)/g, '');
  }

  public async verifyFirebaseIdToken(firebaseIdToken: string, typeProvider = 'phone') {
    /* 
			Проверяем полученный токен firebase и номер телефона
		*/
    let decoded: auth.DecodedIdToken;
    try {
      decoded = await auth().verifyIdToken(firebaseIdToken);
    } catch (error) {
      throw new BadRequestException('Ошибка верификации');
    }

    if (typeProvider && decoded.firebase.sign_in_provider != typeProvider) {
      throw new BadRequestException('Ошибка верификации');
    }

    return decoded;
  }

  public async sendMail(email: string, subject: string, template: { id: number; variables?: any }) {
    return new Promise((resolve, reject) => {
      sendpulse.smtpSendMail(
        (data) => {
          if (!(data && data.result)) {
            reject(data);
          }
          resolve(data);
        },
        {
          subject,
          template,
          from: this.config.get('sendpulse.from'),
          to: [
            {
              name: email,
              email,
            },
          ],
        },
      );
    });
  }

  public async sendMails(
    emails: {
      name: string;
      email: string;
    }[],
    subject: string,
    template: { id: number; variables?: any },
  ) {
    return new Promise((resolve, reject) => {
      sendpulse.smtpSendMail(
        (data) => {
          if (!(data && data.result)) {
            reject(data);
          }
          resolve(data);
        },
        {
          subject,
          template,
          from: this.config.get('sendpulse.from'),
          to: emails,
        },
      );
    });
  }

  public createResetToken(maxTime = 30) {
    const resetToken = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');

    const expireAt = new Date();
    expireAt.setMinutes(expireAt.getMinutes() + maxTime);

    return {
      resetToken,
      expireAt,
    };
  }

  public checkFoundedUser(user: User) {
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    if (user.isBlocked) {
      throw new ForbiddenException('Пользователь заблокирован');
    }
  }

  async signIn({
    phoneOrEmail,
    password,
  }: SignInCredentialsDto): Promise<{
    accessToken: string;
    user: Partial<User>;
  }> {
    const user = await this.userModel.unscoped().findOne({
      where: {
        [Op.or]: [{ phone: this.phoneNumberTransform(phoneOrEmail) }, { email: phoneOrEmail.toLowerCase() }],
      },
      paranoid: false,
    });

    this.checkFoundedUser(user);

    if (user.deletedAt) {
      throw new BadRequestException(
        'Аккаунт удален. Если вы хотите восстановить свой аккаунт, то обратитесь в поддержку сервиса',
      );
    }

    if (!user.checkPassword(password)) {
      throw new UnauthorizedException('Неверно введены данные');
    }

    return this.createJWToken(user);
  }

  async signUp({
    phone,
    password,
    confirmPassword,
    name,
    surname,
    gender,
    birth,
    hobbiesIds,
    cityId,
    firebaseIdToken,
  }: SignUpCredentialsDto): Promise<{
    accessToken: string;
    user: Partial<User>;
  }> {
    if (password !== confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    phone = this.phoneNumberTransform(phone);
    phone = phone.startsWith('+') ? phone : '+' + phone;

    if (!(await this.cityModel.findByPk(cityId))) {
      throw new BadRequestException('Город не найден');
    }

    const existingUser = await this.userModel.unscoped().findOne({
      where: {
        phone,
      },
      paranoid: false,
    });

    if (existingUser) {
      throw new ConflictException('Пользователь уже существует');
    }

    if (!firebaseIdToken) return;

    const decoded = await this.verifyFirebaseIdToken(firebaseIdToken);

    if (decoded.phone_number != phone) {
      throw new BadRequestException('Номер телефона введен неверно');
    }

    const user = await this.userModel.create({
      phone: decoded.phone_number,
      password,
      userType: UserTypes.user,
    });

    await this.profileModel.create({
      userId: user.id,
      name,
      surname,
      gender,
      birth,
      cityId,
    });

    await this.settingModel.create({ userId: user.id });

    const hobbies = await this.hobbieModel.findAll({
      where: {
        id: hobbiesIds,
      },
    });

    const permissions = await this.permissionModel.findOne({
      where: {
        name: [PermissionsNames.client],
      },
    });

    /* 
      Добавляем связанные данные
    */
    await user.$set('hobbies', hobbies);
    await user.$set('permissions', permissions);

    return this.createJWToken(user);
  }

  async signByFirebase({ firebaseIdToken }: SignFirebaseDto): Promise<{ accessToken: string; user: Partial<User> }> {
    const decoded = await this.verifyFirebaseIdToken(firebaseIdToken, '');

    const [name, surname] = decoded.name ? decoded.name.split(' ') : [null, null];
    const { email, uid: firebaseId } = decoded;

    const filter: any[] = [{ firebaseId }];
    if (email) filter.push({ email });

    let user = await this.userModel.unscoped().findOne({
      attributes: ['id', 'userType', 'isBlocked', 'deletedAt', 'firebaseId'],
      where: {
        [Op.or]: filter,
      },
      include: [
        {
          model: Profile,
          attributes: ['name', 'surname', 'gender', 'birth', 'cityId', 'userId'],
          include: [{ model: City, attributes: ['id', 'name'] }],
        },
        {
          model: Hobbie,
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
      ],
      paranoid: false,
    });

    if (user) {
      if (user.isBlocked) {
        throw new ForbiddenException('Пользователь заблокирован');
      }
      if (user.deletedAt) {
        throw new BadRequestException(
          'Аккаунт удален. Если вы хотите восстановить свой аккаунт, то обратитесь в поддержку сервиса',
        );
      }
      if (user.userType !== UserTypes.user) {
        throw new ForbiddenException();
      }

      await user.update({
        firebaseId,
      });

      const profile = user.profile;
      await profile.update({
        name,
        surname,
      });

      const profileInfo = profile.toJSON();
      delete profileInfo.cityId;
      delete profileInfo.userId;
      delete profileInfo.updatedAt;

      profileInfo.hobbies = user.hobbies.length ? user.hobbies : null;

      const needMoreInfo = Object.values(profileInfo).includes(null);

      return this.createJWToken(user, needMoreInfo, profileInfo);
    } else {
      user = await this.userModel.create({
        phone: null,
        email,
        userType: UserTypes.user,
        firebaseId,
      });

      await Promise.all([
        this.profileModel.create({
          userId: user.id,
          name,
          surname,
        }),
        this.settingModel.create({ userId: user.id }),
        this.permissionModel
          .findOne({
            where: {
              name: [PermissionsNames.client],
            },
          })
          .then(async (permission) => await user.$set('permissions', permission)),
      ]);

      return this.createJWToken(user, true, { name, surname, gender: null, birth: null, city: null, hobbies: null });
    }
  }

  async signByVk({ token, vkId, name, surname }: SignVkDto, ip: string) {
    let decoded;
    try {
      decoded = await this.vk.call('secure.checkToken', {
        token,
        ip,
        client_secret: this.config.get('vk.secret'),
      });
    } catch (error) {
      throw new BadRequestException('Ошибка верификации');
    }

    if (decoded.user_id != vkId) {
      throw new BadRequestException('Ошибка верификации');
    }

    let user = await this.userModel.unscoped().findOne({
      attributes: ['id', 'userType', 'isBlocked', 'deletedAt', 'vkId'],
      where: { vkId: decoded.user_id.toString() },
      include: [
        {
          model: Profile,
          attributes: ['name', 'surname', 'gender', 'birth', 'cityId', 'userId'],
          include: [{ model: City, attributes: ['id', 'name'] }],
        },
        {
          model: Hobbie,
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
      ],
      paranoid: false,
    });

    if (user) {
      if (user.isBlocked) {
        throw new ForbiddenException('Пользователь заблокирован');
      }
      if (user.deletedAt) {
        throw new BadRequestException(
          'Аккаунт удален. Если вы хотите восстановить свой аккаунт, то обратитесь в поддержку сервиса',
        );
      }
      if (user.userType !== UserTypes.user) {
        throw new ForbiddenException();
      }

      const profile = user.profile;
      await profile.update({
        name,
        surname,
      });

      const profileInfo = profile.toJSON();
      delete profileInfo.cityId;
      delete profileInfo.userId;
      delete profileInfo.updatedAt;

      profileInfo.hobbies = user.hobbies.length ? user.hobbies : null;

      const needMoreInfo = Object.values(profileInfo).includes(null);

      return this.createJWToken(user, needMoreInfo, profileInfo);
    } else {
      user = await this.userModel.create({
        phone: null,
        email: null,
        userType: UserTypes.user,
        vkId: decoded.user_id,
      });

      await Promise.all([
        this.profileModel.create({
          userId: user.id,
          name,
          surname,
        }),
        this.settingModel.create({ userId: user.id }),
        this.permissionModel
          .findOne({
            where: {
              name: [PermissionsNames.client],
            },
          })
          .then(async (permission) => await user.$set('permissions', permission)),
      ]);

      return this.createJWToken(user, true, { name, surname, gender: null, birth: null, city: null, hobbies: null });
    }
  }

  async signUpManager({ email, password, confirmPassword }: SignUpManagerDto) {
    if (password !== confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    const existingUser = await this.userModel.findOne({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с этим email уже существует');
    }

    const user = await this.userModel.create({
      email: email.toLowerCase(),
      password,
      userType: UserTypes.manager,
    });

    await this.profileModel.create({
      userId: user.id,
    });

    return this.createJWToken(user);
  }

  async resetPasswordPhone({ phone, firebaseIdToken, password, confirmPassword }: ResetPasswordPhoneDto) {
    if (password !== confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    phone = this.phoneNumberTransform(phone);
    phone = phone.startsWith('+') ? phone : '+' + phone;

    const user = await this.userModel.unscoped().findOne({
      where: {
        phone,
      },
    });

    this.checkFoundedUser(user);

    if (!firebaseIdToken) return;

    const decoded = await this.verifyFirebaseIdToken(firebaseIdToken);

    if (decoded.phone_number != phone) {
      throw new BadRequestException('Номер телефона введен неверно');
    }

    user.password = password;
    await user.save();

    return this.createJWToken(user);
  }

  async resetPasswordEmail({ email }: ResetPasswordEmailDto) {
    const user = await this.userModel.unscoped().findOne({
      attributes: ['id', 'isBlocked', 'resetToken', 'resetTokenExpireAt'],
      where: {
        email: email.toLowerCase(),
      },
    });

    this.checkFoundedUser(user);

    const { resetToken, expireAt } = this.createResetToken();

    try {
      await this.sendMail(email, 'Сброс пароля', {
        id: this.config.get('sendpulse.reset_password.template'),
        variables: {
          link: `${this.config.get('sendpulse.reset_password.link')}${resetToken}`,
        },
      });
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Ошибка отправки письма изменения пароля');
    }

    await user.update({
      resetToken,
      resetTokenExpireAt: expireAt,
    });

    return {
      message:
        'На указанный e-mail отправлено письмо с ссылкой на сброс пароля. После перехода по ссылке Вам будет доступно изменение пароля.',
    };
  }

  async resetPasswordEmailVerify({ password, confirmPassword, resetToken }: ResetPasswordEmailVerifyDto) {
    if (password !== confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    const user = await this.userModel.findOne({
      attributes: ['id', 'resetToken', 'resetTokenExpireAt'],
      where: {
        resetToken,
      },
    });

    if (!user) {
      throw new BadRequestException('Срок действия запроса на сброс пароля истек, или ссылка уже использована');
    }

    if (new Date() > new Date(user.resetTokenExpireAt)) {
      throw new BadRequestException('Срок действия запроса на сброс пароля истек, или ссылка уже использована');
    }

    await user.update({
      password,
      resetToken: null,
      resetTokenExpireAt: null,
    });

    return this.createJWToken(user);
  }

  async editEmailVerfiy({ edit_token: editToken }: EditEmailVerifyDto) {
    const email = editToken.slice(editToken.indexOf('_') + 1);

    const user = await this.userModel.findOne({
      attributes: ['id', 'resetToken', 'resetTokenExpireAt'],
      where: {
        resetToken: editToken,
      },
    });

    const render = (text: string) => `
			<h2 style="
				text-align: center;
				font-family: Arial;"
			>${text}</h2>	
		`;

    if (!user) {
      return render('Срок действия запроса изменения электронной почты истек, или ссылка уже использована');
    }

    if (new Date() > new Date(user.resetTokenExpireAt)) {
      return render('Срок действия запроса изменения электронной почты истек, или ссылка уже использована');
    }

    await user.update({
      email: email.toLowerCase(),
      resetToken: null,
      resetTokenExpireAt: null,
    });

    return render(`Электронную почту успешно изменено на ${email}`);
  }
}
