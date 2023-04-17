import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SequelizeModule, SequelizeModuleOptions } from '@nestjs/sequelize';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AcceptLanguageResolver, I18nJsonParser, I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { join } from 'path';
import configDefault from '../config/default';
import configLev from '../config/lev';
import configProduction from '../config/production';
import { AuthModule } from './auth/auth.module';
import { CronModule } from './cron/cron.module';
import { CrossModule } from './cross/cross.module';
import { EventsModule } from './events/events.module';
import { InfoModule } from './info/info.module';
import { LoggerMiddleware } from './logger/logger.middleware';
import { LoggerModule } from './logger/logger.module';
import { MediaModule } from './media/media.module';
import { Log } from './models/log.model';
import { NotificationsModule } from './notifications/notifications.module';
import { RedisCacheModule } from './redis-cache/redis-cache.module';
import { SupportModule } from './support/support.module';
import { UsersModule } from './users/users.module';

const _configs = { production: configProduction, lev: configLev, default: configDefault };

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [_configs[process.env.NODE_ENV] || _configs['default']],
    }),
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return {
          dialect: config.get('database.type'),
          host: config.get('database.host'),
          port: config.get('database.port'),
          username: config.get('database.username'),
          password: config.get('database.password'),
          database: config.get('database.database'),
          synchronize: config.get('database.synchronize'),
          ssl: config.get('database.ssl'),
          autoLoadModels: true,
          logging: config.get('database.logging'),
          benchmark: config.get('database.logging'),
        } as SequelizeModuleOptions;
      },
    }),
    SequelizeModule.forFeature([Log]),
    ServeStaticModule.forRoot(
      {
        // отключить потом
        serveRoot: '/uploads',
        rootPath: join(__dirname, '..', '..', 'uploads'),
        serveStaticOptions: {
          index: false,
        },
      },
      {
        serveRoot: '/logs',
        rootPath: join(__dirname, '..', '..', 'src', 'logger', 'public'),
      },
    ),
    RedisCacheModule,
    AuthModule,
    InfoModule,
    EventsModule,
    UsersModule,
    NotificationsModule,
    MediaModule,
    SupportModule,
    LoggerModule,
    I18nModule.forRoot({
      fallbackLanguage: 'ru',
      parser: I18nJsonParser,
      parserOptions: {
        path: path.join(__dirname, '../i18n/'),
      },
      resolvers: [AcceptLanguageResolver],
    }),
    ScheduleModule.forRoot(),
    CronModule,
    CrossModule,
  ],
})
export class AppModule implements NestModule {
  async configure(consumer: MiddlewareConsumer) {
    await consumer
      .apply(LoggerMiddleware)
      .exclude({ path: 'logs', method: RequestMethod.ALL }, { path: 'logs/(.*)', method: RequestMethod.ALL })
      .forRoutes('*');
  }
}
