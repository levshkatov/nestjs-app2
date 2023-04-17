import { Module } from '@nestjs/common';
import { InfoService } from './info.service';
import { InfoController } from './info.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { City } from '../models/city.model';
import { Hobbie } from '../models/hobbie.model';
import { EventType } from '../models/eventType.model';
import { SupportTitle } from '../models/supportTitle.model';

@Module({
  imports: [SequelizeModule.forFeature([City, Hobbie, EventType, SupportTitle])],
  providers: [InfoService],
  controllers: [InfoController],
  exports: [InfoService],
})
export class InfoModule {}
