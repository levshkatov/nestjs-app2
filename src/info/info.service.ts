import { Injectable, BadRequestException } from '@nestjs/common';
import { City } from '../models/city.model';
import { SearchFilterDto } from './dto/get-filter.dto';
import { Hobbie } from '../models/hobbie.model';
import { CreateHobbieDto } from './dto/create-hobbie.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { EventType } from '../models/eventType.model';
import { CreateEventTypeDto } from './dto/create-eventType.dto';
import { CreateInfoDto } from './dto/create-info.dto';
import { SupportTitle } from '../models/supportTitle.model';

@Injectable()
export class InfoService {
  constructor(
    @InjectModel(City)
    private cityModel: typeof City,

    @InjectModel(Hobbie)
    private hobbieModel: typeof Hobbie,

    @InjectModel(EventType)
    private eventTypeModel: typeof EventType,

    @InjectModel(SupportTitle)
    private supportTitleModel: typeof SupportTitle,
  ) {}

  async getCities({ search }: SearchFilterDto): Promise<City[]> {
    if (search) {
      return this.cityModel.findAll({
        where: { name: { [Op.iLike]: search + '%' } },
        order: ['id'],
      });
    }
    return this.cityModel.findAll({
      limit: 100,
      order: ['id'],
    });
  }

  async getHobbies({ search }: SearchFilterDto) {
    const filterCondition: { name?: any; parentId: any } = { parentId: null };

    if (search) {
      filterCondition.name = { [Op.iLike]: '%' + search + '%' };
      delete filterCondition.parentId;
    }

    return this.hobbieModel.findAll({
      where: filterCondition,
      include: [
        {
          model: Hobbie,
          as: 'children',
        },
      ],
      order: [
        ['name', 'ASC'],
        [
          {
            model: Hobbie,
            as: 'children',
          },
          'name',
          'ASC',
        ],
      ],
    });
  }

  async createHobbie({ name, parentId }: CreateHobbieDto) {
    let parent;
    if (!!parentId) {
      parent = await this.hobbieModel.findByPk(parentId);

      if (!parent) {
        throw new BadRequestException('Parent hobbie not found');
      }
    }

    return await this.hobbieModel.create({
      name,
      parentId: parent ? parent.id : null,
    });
  }

  async editHobbie(id: number, { name, parentId }: CreateHobbieDto) {
    let parent;
    const newData: { name: string; parentId?: number } = { name };
    if (parentId) {
      parent = await this.hobbieModel.findByPk(parentId);

      if (!parent) {
        throw new BadRequestException('Parent hobbie not found');
      }

      newData.parentId = parentId;
    } else if (parentId == 0) {
      newData.parentId = null;
    }

    await this.hobbieModel.update(newData, {
      where: {
        id,
      },
    });
  }

  async delteHobbie(id: number) {
    await this.hobbieModel.destroy({
      where: {
        id,
      },
    });
  }

  async getEventTypes({ search }: SearchFilterDto) {
    const filterCondition: { name?: any } = {};

    if (search) {
      filterCondition.name = { [Op.iLike]: `%${search}%` };
    }

    return this.eventTypeModel.findAll({
      where: filterCondition,
    });
  }

  async createEventType({ name, description }: CreateEventTypeDto) {
    return this.eventTypeModel.create({ name, description });
  }

  async getSupportTitles() {
    return this.supportTitleModel.findAll();
  }

  async createSupportTitle({ name }: CreateInfoDto) {
    return this.supportTitleModel.create({ name });
  }

  async editSupportTitle(id: number, { name }: CreateInfoDto) {
    await this.supportTitleModel.update(
      { name },
      {
        where: {
          id,
        },
      },
    );
  }

  async deleteSupportTitle(id: number) {
    await this.supportTitleModel.destroy({
      where: {
        id,
      },
    });
  }
}
