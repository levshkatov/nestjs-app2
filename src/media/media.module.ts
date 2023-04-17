import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { memoryStorage } from 'multer';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Photo } from '../models/photo.model';
import { Event } from '../models/event.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Photo, Event]),
    ConfigService,
    MulterModule.register({
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Доступные форматы: jpg, jpeg, png, gif'), false);
        }

        cb(undefined, true);
      },
      limits: {
        fileSize: 5242880, // 5MB
      },
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
