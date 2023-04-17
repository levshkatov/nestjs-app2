import { BadRequestException, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Support } from '../models/support.model';
import { SupportTitle } from '../models/supportTitle.model';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    SequelizeModule.forFeature([Support, SupportTitle]),
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
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
