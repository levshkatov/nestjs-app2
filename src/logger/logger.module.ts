import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Log } from '../models/log.model';
import { LoggerController } from './logger.controller';
import { LoggerService } from './logger.service';

@Module({
  imports: [SequelizeModule.forFeature([Log])],
  controllers: [LoggerController],
  providers: [LoggerService],
})
export class LoggerModule {}
