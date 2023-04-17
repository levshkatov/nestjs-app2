import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { City } from '../models/city.model';
import { Hobbie } from '../models/hobbie.model';
import { Setting } from '../models/setting.model';
import { Permission } from '../models/permission.model';
import { UserHobbie } from '../models/userHobbie.model';
import { UserPermission } from '../models/userPermission.model';
import { Profile } from '../models/profile.model';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: async (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
      }),
      inject: [ConfigService],
    }),
    SequelizeModule.forFeature([User, Profile, City, Hobbie, Setting, Permission, UserHobbie, UserPermission]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule, AuthService],
})
export class AuthModule {}
