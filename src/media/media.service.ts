import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PermissionsNames } from '../models/permission.model';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Photo } from '../models/photo.model';
import { User } from '../models/user.model';
import { encode } from 'blurhash';
import * as sharp from 'sharp';
import { extname } from 'path';
import { parse } from 'url';
import { PhotoWithAuthorDto } from '../dto/photo.dto';
import * as EasyYandexS3 from 'easy-yandex-s3';
import { Event } from '../models/event.model';

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Photo)
    private photoModel: typeof Photo,

    @InjectModel(Event)
    private eventModel: typeof Event,

    private config: ConfigService,
  ) { }

  private s3 = new EasyYandexS3({
    auth: {
      accessKeyId: this.config.get('s3.access_key_id'),
      secretAccessKey: this.config.get('s3.secret_access_key'),
    },
    Bucket: this.config.get('s3.bucket_name'),
  });

  async uploadFile(files: [], user: User): Promise<PhotoWithAuthorDto[]> {
    const photos = await Promise.all(
      files.map(async (file: any) => {
        const name = file.originalname.toLowerCase().replace(/[\s]/g, '_');
        const ext = extname(name);
        const filename = Date.now() + '_' + name.split('.').slice(0, -1).join('.');

        const [srcPreview, src, srcOriginal] = await Promise.all([
          this.s3.Upload(
            { buffer: await this.resizeImage(file.buffer, 300, 300, 'outside'), name: `${filename}_300${ext}` },
            '/',
          ),
          this.s3.Upload(
            { buffer: await this.resizeImage(file.buffer, 720, 720, 'inside'), name: `${filename}_720${ext}` },
            '/',
          ),
          this.s3.Upload({ buffer: file.buffer, name }, '/'),
        ]);

        return {
          authorId: user.id,
          src: src.Location,
          srcOriginal: srcOriginal.Location,
          srcPreview: srcPreview.Location,
          blurHash: await this.encodeImageToBlurhash(file.buffer),
        };
      }),
    );

    const createdPhotos = await this.photoModel.bulkCreate(photos);

    const profile = await user.$get('profile', {
      attributes: ['name', 'surname'],
    });

    const profileJSON = profile ? profile.toJSON() : null;

    return createdPhotos.map(({ id, src, srcOriginal, srcPreview, blurHash, createdAt }) => ({
      id,
      src,
      srcOriginal,
      srcPreview,
      blurHash,
      createdAt,
      author: {
        id: user.id,
        userType: user.userType,
        ...profileJSON,
      },
    }));
  }

  async deletePhoto(id: number, user: User) {
    const photo = await this.photoModel.findByPk(id, {
      attributes: ['authorId'],
      include: [
        {
          model: Event,
          as: 'events',
          attributes: ['id'],
          where: {
            creatorId: user.id,
          },
          required: false,
          through: {
            attributes: [],
          },
        },
      ],
    });

    if (!photo) {
      throw new NotFoundException('Фото не найдено');
    }

    const isCreator = photo.events.length > 0;

    if (photo.authorId !== user.id && !isCreator) {
      if (!user.hasPermissions([PermissionsNames.admin, PermissionsNames.mediaPhotoDelete])) {
        throw new BadRequestException('Вы не можете удалить эту фотографию');
      }
    }
    await this.eventModel.update({ photoId: 1 }, { where: { photoId: photo.id } });
    await Promise.all([
      this.s3.Remove(photo.src),
      this.s3.Remove(photo.srcOriginal),
      this.s3.Remove(photo.srcPreview),
      this.photoModel.destroy({
        where: {
          id,
        },
      }),
    ]);

    return {
      message: 'Фотография удалена',
    };
  }

  async resizeImage(buff: any, w: number, h: number, fit: string) {
    return new Promise((resolve, reject) => {
      sharp(buff)
        .ensureAlpha()
        .resize(w, h, { fit })
        .toBuffer((err, buffer) => {
          if (err) return reject(err);
          resolve(buffer);
        });
    });
  }

  async encodeImageToBlurhash(buff: any) {
    return new Promise((resolve, reject) => {
      sharp(buff)
        .raw()
        .ensureAlpha()
        .resize(32, 32, { fit: 'inside' })
        .toBuffer((err, buffer, { width, height }) => {
          if (err) return reject(err);
          resolve(encode(new Uint8ClampedArray(buffer), width, height, 4, 4));
        });
    });
  }
}
