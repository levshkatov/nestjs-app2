import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Event } from '../models/event.model';
import { Photo } from '../models/photo.model';
import { Profile } from '../models/profile.model';
import { Support, SupportType } from '../models/support.model';
import { SupportTitle } from '../models/supportTitle.model';
import { User } from '../models/user.model';
import { CreateTicketDto, EditSupportDto } from './dto/create-ticket.dto';
import { GetTicketsDto } from './dto/get-tickets.dto';
import * as EasyYandexS3 from 'easy-yandex-s3';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(Support)
    private supportModel: typeof Support,

    private config: ConfigService,
  ) {}

  private s3 = new EasyYandexS3({
    auth: {
      accessKeyId: this.config.get('s3.access_key_id'),
      secretAccessKey: this.config.get('s3.secret_access_key'),
    },
    Bucket: this.config.get('s3.bucket_name'),
  });

  async getSupportTickets({ titleId, dateFrom, dateTo, status, type, offset, limit }: GetTicketsDto) {
    const filter: any = {};

    if (titleId) {
      filter.titleId = titleId;
    }
    if (status) {
      filter.status = status;
    }
    if (type) {
      if (type == SupportType.event) {
        filter.eventId = {
          [Op.not]: null,
        };
      }
      if (type == SupportType.user) {
        filter.targetUserId = {
          [Op.not]: null,
        };
      }
      if (type == SupportType.other) {
        filter.eventId = null;
        filter.targetUserId = null;
      }
    }
    if (dateFrom && dateTo) {
      filter.createdAt = {
        [Op.between]: [dateFrom, dateTo],
      };
    } else if (dateFrom) {
      filter.createdAt = {
        [Op.gte]: dateFrom,
      };
    } else if (dateTo) {
      filter.createdAt = {
        [Op.lte]: dateTo,
      };
    }

    return await this.supportModel.findAndCountAll({
      where: filter,
      include: [
        {
          model: SupportTitle,
          as: 'title',
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'isBlocked', 'createdAt', 'userType'],
          include: [Profile.scope('simple')],
          required: false,
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name'],
          include: [
            {
              model: Photo,
              as: 'photo',
            },
          ],
          required: false,
        },
        {
          model: User,
          as: 'targetUser',
          attributes: ['id', 'isBlocked', 'createdAt', 'userType'],
          include: [Profile.scope('simple')],
          required: false,
        },
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });
  }

  async getSupportTicket(id: number) {
    const support = await this.supportModel.findByPk(id, {
      include: [
        {
          model: SupportTitle,
          as: 'title',
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'isBlocked', 'createdAt', 'userType'],
          include: [Profile.scope('simple')],
          required: false,
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name'],
          include: [
            {
              model: Photo,
              as: 'photo',
            },
          ],
          required: false,
        },
        {
          model: User,
          as: 'targetUser',
          attributes: ['id', 'isBlocked', 'createdAt', 'userType'],
          include: [Profile.scope('simple')],
          required: false,
        },
      ],
    });

    if (!support) {
      throw new NotFoundException('Обращение не найдено');
    }

    return support;
  }

  async createSupportTicket(createDto: CreateTicketDto, files: [], user: User) {
    const filesSrc = await Promise.all(
      files.map(async (file: any) => {
        const filename = Date.now() + '_' + file.originalname.toLowerCase().replace(/[\s]/g, '_');

        const { Location } = await this.s3.Upload({ buffer: file.buffer, name: filename }, '/support');
        return Location;
      }),
    );

    try {
      await this.supportModel.create({
        ...createDto,
        files: filesSrc,
        userId: user ? user.id : undefined,
      });

      return {
        message: 'В течение 3-х дней мы ответим Вам по указанному e-mail',
      };
    } catch (errpr) {
      throw new BadRequestException('Ошибка создания обращения в поддержку');
    }
  }

  async editSupport(id: number, { status }: EditSupportDto) {
    const support = await this.supportModel.findByPk(id);

    if (!support) {
      throw new NotFoundException('Обращение не найдено');
    }

    await support.update({
      status,
    });

    return {
      message: `Статус изменен на ${status}`,
    };
  }
}
