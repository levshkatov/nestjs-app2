import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { HttpException, Injectable } from '@nestjs/common';
import { JwtPayload } from './jwt-payload.interface';
import { User } from '../models/user.model';
import { Permission } from '../models/permission.model';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    private config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('jwt.secret'),
    });
  }

  /* 
		Метод проверки пользователя уже по расшифрованном jwt токену
	*/
  async validate({ id }: JwtPayload): Promise<User> {
    const user = await this.userModel.unscoped().findByPk(id, {
      attributes: {
        exclude: ['password', 'resetToken', 'resetTokenExpireAt', 'updatedAt'],
      },
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });

    if (!user) {
      throw new HttpException(
        {
          statusCode: 401,
          errors: ['Ошибка авторизации'],
        },
        401,
      );
    }

    if (user.isBlocked) {
      throw new HttpException(
        {
          statusCode: 403,
          errors: ['Пользователь заблокирован'],
        },
        403,
      );
    }

    return user;
  }
}
