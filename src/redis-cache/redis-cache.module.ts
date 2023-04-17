import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { RedisCacheService } from './redis-сache.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        url: configService.get('redis.url'),
        ttl: configService.get('redis.ttl'),
      }),
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService] // This is IMPORTANT,  you need to export RedisCacheService here so that other modules can use it
})
export class RedisCacheModule { }