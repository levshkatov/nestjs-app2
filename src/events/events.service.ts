import { Injectable, BadRequestException } from '@nestjs/common';
import { User } from '../models/user.model';
import { Event, EventState } from '../models/event.model';
import { InjectModel } from '@nestjs/sequelize';
import { City } from '../models/city.model';
import { EventType } from '../models/eventType.model';
import { Hobbie } from '../models/hobbie.model';
import { EventMember, EventMemberState } from '../models/eventMember.model';
import { col, fn, Includeable, Op, Sequelize } from 'sequelize';
import { EventDate } from '../models/eventDates.model';
import * as moment from 'moment';
import { EventAction, EventActionReqDto } from './dto/event-action.dto';
import { EventPhoto } from '../models/eventPhoto.model';
import { Profile, ProfileGender } from '../models/profile.model';
import { EventComment } from '../models/eventComment.model';
import { EventCommentDto, EventCommentReqDto, EventCommentsIdsReqDto } from './dto/event-comment.dto';
import { PermissionsNames } from '../models/permission.model';
import { MessageDto } from '../dto/simple-response.dto';
import { EventMemberDto, EventMemberDtoState, EventMemberReqDto, EventMemberRole } from './dto/event-member.dto';
import { EventPhotoIdsReqDto, EventPhotoPagedDto, EventPhotoReqDto } from './dto/event-photo.dto';
import {
  EventPagedDto,
  EventPartialDto,
  EventReqType,
  EventDto,
  EventsFeedReqDto,
  EventsReqDto,
  EventParticipationState,
  EventCreateReqDto,
  EventEditReqDto,
  EventReqStatus,
  EventsAllReqDto,
} from './dto/event.dto';
import { Photo } from '../models/photo.model';
import { PhotoWithAuthorDto } from '../dto/photo.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationActionText, NotificationType } from '../models/notification.model';
import { UserFriend } from '../models/userFriend.model';
import { EventSchedule } from '../models/eventSchedule.model';
import { I18nContext } from 'nestjs-i18n';
import { EventReview } from '../models/eventReview.model';
import { EventRateDto, EventReviewDto, EventReviewReqDto } from './dto/event-review.dto';
import { CrossService } from '../cross/cross.service';

export const eventTypes = {
  'Открытое событие': 1,
  'Закрытое событие': 2,
  Афиша: 3,
  'Для друзей': 4,
  Путешествие: 5,
};

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event)
    private eventModel: typeof Event,

    @InjectModel(City)
    private cityModel: typeof City,

    @InjectModel(EventType)
    private eventTypeModel: typeof EventType,

    @InjectModel(Hobbie)
    private hobbieModel: typeof Hobbie,

    @InjectModel(EventDate)
    private eventDateModel: typeof EventDate,

    @InjectModel(EventMember)
    private eventMemberModel: typeof EventMember,

    @InjectModel(EventPhoto)
    private eventPhotoModel: typeof EventPhoto,

    @InjectModel(EventComment)
    private eventCommentModel: typeof EventComment,

    @InjectModel(EventSchedule)
    private eventScheduleModel: typeof EventSchedule,

    @InjectModel(EventReview)
    private eventReviewModel: typeof EventReview,

    @InjectModel(Profile)
    private profileModel: typeof Profile,

    @InjectModel(Photo)
    private photoModel: typeof Photo,

    private notifyService: NotificationsService,

    private crossService: CrossService,

    @InjectModel(UserFriend)
    private userFriendModel: typeof UserFriend,

    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async getEvents(
    i18n: I18nContext,
    {
      userId,
      type,
      cityId,
      status,
      hobbiesIds,
      membersFrom,
      membersTo,
      dateFrom,
      dateTo,
      search,
      minLatitude,
      minLongitude,
      maxLatitude,
      maxLongitude,
      offset,
      limit,
    }: EventsReqDto,
    user: User,
  ): Promise<EventPagedDto> {
    const eventFilters: any = [{}];
    const filterEventDate: any = {};

    if (type === EventReqType.actual) {
      eventFilters.push({
        state: [EventState.actual],
      });
    }

    if (type === EventReqType.history) {
      eventFilters.push({
        state: [EventState.cancelled, EventState.finished],
      });
    }

    if (type === EventReqType.created) {
      eventFilters.push({
        creatorId: userId || user.id,
      });

      // Для поиска афиш в ЛК

      if (cityId) {
        eventFilters.push({ cityId });
      }

      if (status) {
        const eventState =
          status === EventReqStatus.actual
            ? EventState.actual
            : status === EventReqStatus.cancelled
            ? EventState.cancelled
            : status === EventReqStatus.finished
            ? EventState.finished
            : status === EventReqStatus.unpublished
            ? EventState.unpublished
            : null;

        if (eventState) {
          eventFilters.push({
            state: [eventState],
          });
        }
      }

      if (membersFrom && membersTo) {
        eventFilters.push({
          countMembers: {
            [Op.between]: [membersFrom, membersTo],
          },
        });
      } else if (membersFrom) {
        eventFilters.push({
          countMembers: {
            [Op.gte]: membersFrom,
          },
        });
      } else if (membersTo) {
        eventFilters.push({
          countMembers: {
            [Op.lte]: membersTo,
          },
        });
      }

      if (dateFrom) {
        filterEventDate.from = {
          [Op.gte]: dateFrom,
        };
      }

      if (dateTo) {
        filterEventDate.to = {
          [Op.lte]: dateTo,
        };
      }

      if (search) {
        eventFilters.push({
          name: { [Op.iLike]: `%${search}%` },
        });
      }
    }

    if (minLatitude && minLongitude && maxLatitude && maxLongitude) {
      const inArea = Sequelize.literal(
        `ST_Covers(ST_MakeEnvelope(${minLongitude}, ${minLatitude}, ${maxLongitude}, ${maxLatitude})::geography,"Event"."location"::geography)`,
      );

      eventFilters.push(inArea);
    }

    const includeArray: Includeable[] = [
      {
        model: EventDate,
        where: filterEventDate,
        attributes: ['from', 'to'],
      },
      {
        model: City,
        attributes: ['id', 'name'],
      },
      {
        model: EventType,
        attributes: ['id', 'name', 'description'],
      },
      {
        model: Hobbie,
        as: 'hobbies',
        where: hobbiesIds ? { id: hobbiesIds } : null,
        through: {
          attributes: [],
        },
      },
      {
        model: Photo.scope('withAuthor'),
        attributes: {
          include: ['authorId'],
        },
        as: 'photo',
      },
      {
        model: User,
        as: 'members',
        where: [EventReqType.history, EventReqType.actual].includes(type) ? { id: userId || user.id } : null,
        attributes: [],
        through: {
          where: [EventReqType.history, EventReqType.actual].includes(type) ? { isBlocked: false } : null,
        },
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'userType'],
        include: [
          {
            model: Profile,
            attributes: ['name', 'surname'],
            include: [
              {
                model: Photo,
              },
            ],
          },
        ],
      },
    ];

    const { count, rows } = await this.eventModel.findAndCountAll({
      where: {
        [Op.and]: eventFilters,
      },
      include: includeArray,
      attributes: {
        exclude: [
          'totalAge',
          'updatedAt',
          'isFree',
          'regulations',
          'site',
          'registrationLink',
          'unpublishReason',
          'countEdits',
        ],
      },
      limit,
      offset,
      order: [
        ['startFrom', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      distinct: true,
    });

    const _rows: EventPartialDto[] = rows.map((event) => {
      const eventJSON: any = event.toJSON();
      const creatorJSON: any = event.creator.toJSON();
      const photoJSON: any = event.photo ? event.photo.toJSON() : null;
      if (photoJSON) {
        delete photoJSON.authorId;
      }

      const photo = event.photo
        ? {
            ...photoJSON,
            author: {
              id: photoJSON.author.id,
              userType: photoJSON.author.userType,
              ...photoJSON.author.profile,
            },
          }
        : null;

      delete eventJSON.totalAge;
      delete eventJSON.location;

      return {
        ...eventJSON,
        creator: creatorJSON,
        latitude: event.location.latitude,
        longitude: event.location.longitude,
        photo,
      };
    });

    return {
      count,
      events: _rows,
    };
  }

  async createEvent(
    i18n: I18nContext,
    {
      name,
      photoId,
      description,
      cityId,
      address,
      latitude,
      longitude,
      dates,
      typeId,
      hobbiesIds,
      maxMembers,
      isFree,
      regulations,
      site,
      schedules,
      registrationLink,
    }: EventCreateReqDto,
    user: User,
  ): Promise<EventDto> {
    if (!maxMembers) {
      maxMembers = 1000000;
    }

    if (!hobbiesIds || !hobbiesIds.length) {
      throw new BadRequestException(await i18n.translate('events.e.noHobbies'));
    }

    const city = await this.cityModel.findByPk(cityId, {
      attributes: ['id', 'name'],
    });
    if (!city) {
      throw new BadRequestException(await i18n.translate('events.e.notFound.city'));
    }

    const type = await this.eventTypeModel.findByPk(typeId, {
      attributes: ['id', 'name', 'description'],
    });
    if (!type) {
      throw new BadRequestException(await i18n.translate('events.e.notFound.type'));
    }
    if (type.id === eventTypes['Афиша']) {
      user.hasPermissions(
        [PermissionsNames.admin, PermissionsNames.manager],
        await i18n.translate('events.e.massEvent.create'),
      );
    }

    const photo = await this.photoModel.findOne({
      where: {
        id: photoId,
        authorId: user.id,
      },
      attributes: ['id', 'src', 'blurHash', 'createdAt'],
      include: [
        {
          model: User,
          attributes: ['id', 'userType'],
          include: [
            {
              model: Profile,
              attributes: ['name', 'surname'],
            },
          ],
        },
      ],
    });
    if (!photo) {
      throw new BadRequestException(await i18n.translate('events.e.notFound.photo'));
    }

    for (const date of dates) {
      if (!date.from || !date.to) {
        throw new BadRequestException(await i18n.translate('events.e.dates.pair'));
      }

      if (date.from > date.to) {
        throw new BadRequestException(await i18n.translate('events.e.dates.limit'));
      }
    }

    if (dates.length > 1 && type.id !== eventTypes['Афиша']) {
      throw new BadRequestException(await i18n.translate('events.e.massEvent.dates'));
    }

    const startFrom = dates.sort((a, b) => (a.from > b.from ? 1 : a.from < b.from ? -1 : 0))[0].from;
    const finishTo = dates.sort((a, b) => (a.to < b.to ? 1 : a.to > b.to ? -1 : 0))[0].to;

    const event = await Event.create({
      name,
      photoId,
      description,
      address,
      location: {
        latitude,
        longitude,
      },
      maxMembers,
      countEdits: 0,
      cityId,
      creatorId: user.id,
      typeId,
      state: 'actual',
      startFrom,
      finishTo,
      isFree: type.id === eventTypes['Афиша'] ? isFree : null,
      regulations: type.id === eventTypes['Афиша'] ? regulations : null,
      site: type.id === eventTypes['Афиша'] ? site : null,
      registrationLink: type.id === eventTypes['Афиша'] ? registrationLink : null,
    });

    await this.eventPhotoModel.create({
      eventId: event.id,
      photoId,
    });

    await this.updateEventAvgAge(user, event, 'enter');

    const datesWithEventId: any = [];
    dates.forEach((date) =>
      datesWithEventId.push({
        eventId: event.id,
        ...date,
      }),
    );

    await EventDate.bulkCreate(datesWithEventId);

    const hobbiesIdsFormated = hobbiesIds.filter((id) => typeof id === 'number');
    const hobbies = await this.hobbieModel.findAll({
      where: {
        id: hobbiesIdsFormated,
      },
    });

    await event.$set('hobbies', hobbies);

    const creator = await User.findByPk(user.id, {
      include: [
        {
          model: Profile,
          attributes: ['name', 'surname', 'gender'],
          include: [
            {
              model: Photo,
            },
          ],
        },
      ],
      attributes: ['id', 'userType'],
    });

    if (type.id === eventTypes['Афиша'] && schedules && schedules.length) {
      const schedulesWithEventId: any = [];
      schedules.forEach((schedule) => {
        schedulesWithEventId.push({
          eventId: event.id,
          date: schedule.date,
          daySchedule: JSON.stringify(schedule.daySchedule),
        });
      });

      await EventSchedule.bulkCreate(schedulesWithEventId);

      this.notifyService.sendNotificationByTopic(
        `manager_${creator.id}`,
        {
          body: `Организатор ${creator.profile.name} создал новое событие`,
        },
        {
          type: NotificationType.eventFromManager,
          eventId: event.id.toString(),
          targetUserId: creator.id.toString(),
        },
      );

      this.notifyService.createNotificationForFollowers(creator.id, {
        type: NotificationType.eventFromManager,
        eventId: event.id,
      });
    }

    event.setDataValue('hobbies', hobbies);
    event.setDataValue('city', city);
    event.setDataValue('type', type);
    event.setDataValue('creator', creator);

    const eventJSON: any = event.toJSON();
    const photoJSON: any = photo ? photo.toJSON() : null;

    const _photo = photo
      ? {
          ...photoJSON,
          author: {
            id: photoJSON.author.id,
            userType: photoJSON.author.userType,
            ...photoJSON.author.profile,
          },
        }
      : null;

    if (type.id === eventTypes['Для друзей']) {
      this.userFriendModel
        .findAll({
          where: {
            userId: user.id,
            isAccepted: true,
            isBlocked: null,
          },
          raw: true,
        })
        .then((friends) => {
          const friendsIds = friends.map((f) => f.friendId);
          this.notifyService
            .sendNotification(
              friendsIds,
              {
                body: `${creator.profile.name} ${creator.profile.surname} ${
                  creator.profile.gender === ProfileGender.female ? 'создала' : 'создал'
                } новое событие для друзей`,
              },
              {
                type: NotificationType.eventForFriends,
                eventId: event.id.toString(),
                targetUserId: creator.id.toString(),
              },
              {
                pushRemindOnFriends: true,
              },
            )
            .then(({ users }) => {
              this.notifyService.createNotificationForUsers(users, {
                type: NotificationType.eventForFriends,
                eventId: event.id,
                targetUserId: creator.id,
              });
            });
        });
    }

    await this.crossService.create(eventJSON.id, user.id);

    return {
      id: eventJSON.id,
      name: eventJSON.name,
      description: eventJSON.description,
      address: eventJSON.address,
      state: eventJSON.state,
      maxMembers: eventJSON.maxMembers,
      countMembers: eventJSON.countMembers,
      averageAge: eventJSON.averageAge,
      createdAt: eventJSON.createdAt,
      countEdits: 0,
      startFrom: eventJSON.startFrom,
      finishTo: eventJSON.finishTo,
      city: eventJSON.city,
      creator: eventJSON.creator,
      hobbies: eventJSON.hobbies,
      type: eventJSON.type,
      isFree: eventJSON.isFree,
      regulations: eventJSON.regulations,
      registrationLink: eventJSON.registrationLink,
      unpublishReason: null,
      site: eventJSON.site,
      schedules: type.id === eventTypes['Афиша'] ? schedules : null,
      photo: _photo,
      longitude,
      latitude,
      dates,
      participationState: EventParticipationState.unavailable,
      photos: [],
      photosCount: 0,
      members: [],
      comments: [],
    };
  }

  async getEventsFeed(
    i18n: I18nContext,
    {
      cityId,
      latitude,
      longitude,
      radius,
      hobbiesIds,
      membersFrom,
      membersTo,
      eventTypeIds,
      ageFrom,
      ageTo,
      dateFrom,
      dateTo,
      search,
      onlyFree,
      minLatitude,
      minLongitude,
      maxLatitude,
      maxLongitude,
      offset,
      limit,
    }: EventsFeedReqDto,
    user: User,
  ): Promise<EventPagedDto> {
    const eventFilters: any = [];
    const eventAttributes: any = [];
    const filterHobbie: any = {};
    const filterEventType: any = {};
    const filterEventDate: any = {};

    eventFilters.push({ state: EventState.actual });

    if (cityId) {
      eventFilters.push({ cityId });
    }

    if (search) {
      eventFilters.push({
        name: {
          [Op.iLike]: `%${search}%`,
        },
      });
    }

    if (radius && latitude && longitude) {
      // eventFilters.push(Sequelize.where(distance, '<=', Sequelize.literal(`${radius * 1000}`)));
      eventFilters.push(
        Sequelize.literal(
          `ST_DWithin("Event"."location"::geography,ST_MakePoint(${longitude}, ${latitude})::geography,${
            radius * 1000
          })`,
        ),
      );

      // eventAttributes.push([distance, 'distance']); // For distance in every event
    }

    if (minLatitude && minLongitude && maxLatitude && maxLongitude) {
      const inArea = Sequelize.literal(
        `ST_Covers(ST_MakeEnvelope(${minLongitude}, ${minLatitude}, ${maxLongitude}, ${maxLatitude})::geography,"Event"."location"::geography)`,
      );

      eventFilters.push(inArea);
    }

    if (membersFrom && membersTo) {
      eventFilters.push({
        countMembers: {
          [Op.between]: [membersFrom, membersTo],
        },
      });
    } else if (membersFrom) {
      eventFilters.push({
        countMembers: {
          [Op.gte]: membersFrom,
        },
      });
    } else if (membersTo) {
      eventFilters.push({
        countMembers: {
          [Op.lte]: membersTo,
        },
      });
    }

    if (ageFrom && ageTo) {
      eventFilters.push({
        averageAge: {
          [Op.between]: [ageFrom, ageTo],
        },
      });
    } else if (ageFrom) {
      eventFilters.push({
        averageAge: {
          [Op.gte]: ageFrom,
        },
      });
    } else if (ageTo) {
      eventFilters.push({
        averageAge: {
          [Op.lte]: ageTo,
        },
      });
    }

    if (dateFrom) {
      filterEventDate.from = {
        [Op.gte]: dateFrom,
      };
    }

    if (dateTo) {
      filterEventDate.to = {
        [Op.lte]: dateTo,
      };
    }

    if (hobbiesIds) {
      filterHobbie.id = hobbiesIds;
    }

    if (eventTypeIds) {
      filterEventType.id = eventTypeIds;
    }

    if (onlyFree) {
      eventFilters.push({
        isFree: true,
      });
    }

    if (user && user.id) {
      const events = await this.eventModel.findAll({
        where: {
          typeId: eventTypes['Для друзей'],
        },
        include: [
          {
            model: User,
            as: 'creator',
            include: [
              {
                model: User,
                as: 'friends',
                attributes: ['id'],
                required: true,
                where: {
                  id: user.id,
                },
                through: {
                  attributes: [],
                  where: {
                    isBlocked: null,
                    isAccepted: true,
                  },
                },
              },
            ],
          },
        ],
      });

      const eventsIds = events.map((el) => el.id);

      eventFilters.push({
        [Op.or]: [
          {
            typeId: {
              [Op.not]: eventTypes['Для друзей'],
            },
          },
          {
            id: eventsIds,
          },
        ],
      });
    }

    const { count, rows } = await this.eventModel.findAndCountAll({
      where: {
        [Op.and]: eventFilters,
      },
      attributes: {
        include: eventAttributes,
        exclude: [
          'totalAge',
          'updatedAt',
          'isFree',
          'regulations',
          'site',
          'registrationLink',
          'unpublishReason',
          'countEdits',
        ],
      },
      include: [
        {
          model: EventDate,
          as: 'dates',
          where: filterEventDate,
          attributes: ['from', 'to'],
        },
        {
          model: City,
          attributes: ['id', 'name'],
        },
        {
          model: EventType,
          where: filterEventType,
          attributes: ['id', 'name', 'description'],
        },
        {
          model: Hobbie,
          as: 'hobbies',
          where: filterHobbie,
          through: {
            attributes: [],
          },
        },
        {
          model: Photo.scope('withAuthor'),
          attributes: {
            include: ['authorId'],
          },
          as: 'photo',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'userType'],
          include: [
            {
              model: Profile,
              attributes: ['name', 'surname'],
              include: [
                {
                  model: Photo,
                },
              ],
            },
          ],
        },
      ],
      order: [
        ['startFrom', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
      distinct: true,
    });

    const _rows: EventPartialDto[] = rows.map((event) => {
      const eventJSON: any = event.toJSON();
      const creatorJSON: any = event.creator.toJSON();
      delete creatorJSON.friends;
      const photoJSON: any = event.photo ? event.photo.toJSON() : null;
      if (photoJSON) {
        delete photoJSON.authorId;
      }

      const photo = event.photo
        ? {
            ...photoJSON,
            author: {
              id: photoJSON.author.id,
              userType: photoJSON.author.userType,
              ...photoJSON.author.profile,
            },
          }
        : null;

      delete eventJSON.totalAge;
      delete eventJSON.location;

      return {
        ...eventJSON,
        creator: creatorJSON,
        latitude: event.location.latitude,
        longitude: event.location.longitude,
        photo,
      };
    });

    return {
      count,
      events: _rows,
    };
  }

  async getAllEvents(
    i18n: I18nContext,
    {
      status,
      cityId,
      latitude,
      longitude,
      radius,
      hobbiesIds,
      membersFrom,
      membersTo,
      eventTypeIds,
      ageFrom,
      ageTo,
      dateFrom,
      dateTo,
      search,
      onlyFree,
      minLatitude,
      minLongitude,
      maxLatitude,
      maxLongitude,
      offset,
      limit,
    }: EventsAllReqDto,
    user: User,
  ): Promise<EventPagedDto> {
    const eventFilters: any = [];
    const eventAttributes: any = [];
    const filterHobbie: any = {};
    const filterEventType: any = {};
    const filterEventDate: any = {};

    user.hasPermissions(
      [PermissionsNames.admin, PermissionsNames.eventsGet],
      await i18n.translate('events.e.noPermission'),
    );

    if (status) {
      eventFilters.push({ state: status });
    }

    if (cityId) {
      eventFilters.push({ cityId });
    }

    if (search) {
      eventFilters.push({
        name: {
          [Op.iLike]: `%${search}%`,
        },
      });
    }

    if (radius && latitude && longitude) {
      eventFilters.push(
        Sequelize.literal(
          `ST_DWithin("Event"."location"::geography,ST_MakePoint(${longitude}, ${latitude})::geography,${
            radius * 1000
          })`,
        ),
      );
    }

    if (minLatitude && minLongitude && maxLatitude && maxLongitude) {
      const inArea = Sequelize.literal(
        `ST_Covers(ST_MakeEnvelope(${minLongitude}, ${minLatitude}, ${maxLongitude}, ${maxLatitude})::geography,"Event"."location"::geography)`,
      );
      eventFilters.push(inArea);
    }

    if (membersFrom && membersTo) {
      eventFilters.push({
        countMembers: {
          [Op.between]: [membersFrom, membersTo],
        },
      });
    } else if (membersFrom) {
      eventFilters.push({
        countMembers: {
          [Op.gte]: membersFrom,
        },
      });
    } else if (membersTo) {
      eventFilters.push({
        countMembers: {
          [Op.lte]: membersTo,
        },
      });
    }

    if (ageFrom && ageTo) {
      eventFilters.push({
        averageAge: {
          [Op.between]: [ageFrom, ageTo],
        },
      });
    } else if (ageFrom) {
      eventFilters.push({
        averageAge: {
          [Op.gte]: ageFrom,
        },
      });
    } else if (ageTo) {
      eventFilters.push({
        averageAge: {
          [Op.lte]: ageTo,
        },
      });
    }

    if (dateFrom) {
      filterEventDate.from = {
        [Op.gte]: dateFrom,
      };
    }

    if (dateTo) {
      filterEventDate.to = {
        [Op.lte]: dateTo,
      };
    }

    if (hobbiesIds) {
      filterHobbie.id = hobbiesIds;
    }

    if (eventTypeIds) {
      filterEventType.id = eventTypeIds;
    }

    if (onlyFree) {
      eventFilters.push({
        isFree: true,
      });
    }

    const { count, rows } = await this.eventModel.findAndCountAll({
      where: {
        [Op.and]: eventFilters,
      },
      attributes: {
        include: eventAttributes,
        exclude: [
          'totalAge',
          'updatedAt',
          'isFree',
          'regulations',
          'site',
          'registrationLink',
          'unpublishReason',
          'countEdits',
        ],
      },
      include: [
        {
          model: EventDate,
          as: 'dates',
          where: filterEventDate,
          attributes: ['from', 'to'],
        },
        {
          model: City,
          attributes: ['id', 'name'],
        },
        {
          model: EventType,
          where: filterEventType,
          attributes: ['id', 'name', 'description'],
        },
        {
          model: Hobbie,
          as: 'hobbies',
          where: filterHobbie,
          through: {
            attributes: [],
          },
        },
        {
          model: Photo.scope('withAuthor'),
          attributes: {
            include: ['authorId'],
          },
          as: 'photo',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'userType'],
          include: [
            {
              model: Profile,
              attributes: ['name', 'surname'],
              include: [
                {
                  model: Photo,
                },
              ],
            },
          ],
        },
      ],
      order: [
        ['startFrom', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
      distinct: true,
    });

    const _rows: EventPartialDto[] = rows.map((event) => {
      const eventJSON: any = event.toJSON();
      const creatorJSON: any = event.creator.toJSON();
      delete creatorJSON.friends;
      const photoJSON: any = event.photo ? event.photo.toJSON() : null;
      if (photoJSON) {
        delete photoJSON.authorId;
      }

      const photo = event.photo
        ? {
            ...photoJSON,
            author: {
              id: photoJSON.author.id,
              userType: photoJSON.author.userType,
              ...photoJSON.author.profile,
            },
          }
        : null;

      delete eventJSON.totalAge;
      delete eventJSON.location;

      return {
        ...eventJSON,
        creator: creatorJSON,
        latitude: event.location.latitude,
        longitude: event.location.longitude,
        photo,
      };
    });

    return {
      count,
      events: _rows,
    };
  }

  async getEventById(i18n: I18nContext, eventId: number, user: User): Promise<EventDto> {
    const event = await this.eventModel.findByPk(eventId, {
      include: [
        {
          model: EventDate,
          attributes: ['from', 'to'],
        },
        {
          model: EventSchedule,
          attributes: ['date', 'daySchedule'],
        },
        {
          model: City,
          attributes: ['id', 'name'],
        },
        {
          model: EventType,
          attributes: ['id', 'name', 'description'],
        },
        {
          model: EventComment,
          attributes: ['id', 'text', 'createdAt'],
        },
        {
          model: Hobbie,
          as: 'hobbies',
          through: {
            attributes: [],
          },
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'userType'],
          include: [
            {
              model: Profile,
              attributes: ['name', 'surname'],
              include: [
                {
                  model: Photo,
                },
              ],
            },
          ],
        },
        {
          model: Photo.scope('withAuthor'),
          as: 'photo',
        },
      ],
      attributes: {
        exclude: ['updatedAt', 'totalAge'],
      },
    });

    if (!event) {
      throw new BadRequestException(await i18n.translate('events.e.notFound.event'));
    }

    let participationState = EventParticipationState.unavailable;

    if (user && event.creator.id !== user.id) {
      const userIsMember = await this.eventMemberModel.findOne({
        where: {
          eventId,
          userId: user.id,
        },
      });

      if (!userIsMember) {
        participationState = EventParticipationState.available;
      } else {
        if (userIsMember.isBlocked) {
          participationState = EventParticipationState.blocked;
        } else {
          participationState =
            userIsMember.state === EventMemberState.joined
              ? EventParticipationState.joined
              : userIsMember.state === EventMemberState.pending
              ? EventParticipationState.pending
              : EventParticipationState.unavailable;
        }
      }
    }

    const members = await this.eventMemberModel.findAll({
      limit: 3,
      where: {
        eventId: event.id,
        state: EventMemberState.joined,
        isBlocked: false,
      },
      include: [
        {
          model: User,
          attributes: ['id', 'userType'],
          include: [
            {
              model: Profile,
              attributes: ['name', 'surname'],
              include: [
                {
                  model: Photo,
                },
              ],
            },
          ],
        },
      ],
    });

    const photos = await this.eventPhotoModel.findAndCountAll({
      where: { eventId },
      attributes: [],
      include: [
        {
          model: Photo.scope('withAuthor'),
          as: 'photo',
        },
      ],
      limit: 10,
      distinct: true,
      col: 'photoId',
      order: [['createdAt', 'DESC']],
    });

    const eventJSON: any = event.toJSON();
    const creatorJSON: any = event.creator.toJSON();
    const photoJSON: any = event.photo ? event.photo.toJSON() : null;

    const photo = event.photo
      ? {
          ...photoJSON,
          author: {
            id: photoJSON.author.id,
            userType: photoJSON.author.userType,
            ...photoJSON.author.profile,
          },
        }
      : null;

    delete eventJSON.location;

    const photosJSON = photos.rows.map(({ photo }) => {
      const photoJSON: any = photo.toJSON();
      return {
        ...photoJSON,
        author: {
          id: photoJSON.author.id,
          userType: photoJSON.author.userType,
          ...photoJSON.author.profile,
        },
      };
    });

    const membersJSON = members.map((member) => {
      const userJSON = member.user.toJSON();
      return {
        ...userJSON,
      };
    });

    const commentsJSON = event.comments.map((comment) => {
      const commentJSON = comment.toJSON();
      return {
        ...commentJSON,
        author: creatorJSON,
      };
    });

    const schedulesJSON = event.schedules
      ? event.schedules.map((schedule) => {
          const scheduleJSON: any = schedule.toJSON();
          return {
            ...scheduleJSON,
            daySchedule: JSON.parse(scheduleJSON.daySchedule),
          };
        })
      : null;

    return {
      ...eventJSON,
      creator: creatorJSON,
      members: membersJSON,
      latitude: event.location.latitude,
      longitude: event.location.longitude,
      photo,
      photosCount: photos.count,
      photos: photosJSON,
      comments: commentsJSON,
      participationState,
      schedules: schedulesJSON,
    };
  }

  async editEvent(
    i18n: I18nContext,
    eventId: number,
    {
      photoId,
      description,
      address,
      latitude,
      longitude,
      dates,
      isFree,
      regulations,
      site,
      schedules,
      registrationLink,
      maxMembers,
      countEdits,
    }: EventEditReqDto,
    user: User,
  ): Promise<EventDto> {
    const updateObject: any = {};
    const event = await this.getEvent(i18n, eventId);

    if (event.creator.id !== user.id) {
      user.hasPermissions(
        [PermissionsNames.admin, PermissionsNames.eventEdit],
        await i18n.translate('events.e.event.change'),
      );
    }

    if (![EventState.actual, EventState.unpublished].includes(event.state)) {
      throw new BadRequestException(await i18n.translate('events.e.event.onlyActual'));
    }

    if (description || description === '') {
      updateObject.description = description;
    }

    if (address || address === '') {
      updateObject.address = address;
    }

    if (maxMembers && maxMembers > event.maxMembers) {
      updateObject.maxMembers = maxMembers;
    }

    if (countEdits || countEdits === 0) {
      updateObject.countEdits = countEdits;
    }

    if (latitude && longitude) {
      updateObject.location = {
        latitude,
        longitude,
      };
    }

    if (event.type.id === eventTypes['Афиша']) {
      if ([true, false].includes(isFree)) {
        updateObject.isFree = isFree;
      }

      if (regulations || regulations === '') {
        updateObject.regulations = regulations;
      }

      if (site || site === '') {
        updateObject.site = site;
      }

      if (registrationLink || registrationLink === '') {
        updateObject.registrationLink = registrationLink;
      }

      if (schedules && schedules.length) {
        const schedulesWithEventId: any = [];
        schedules.forEach((schedule) =>
          schedulesWithEventId.push({
            eventId: event.id,
            date: schedule.date,
            daySchedule: JSON.stringify(schedule.daySchedule),
          }),
        );

        await this.eventScheduleModel.destroy({
          where: {
            eventId,
          },
        });

        await EventSchedule.bulkCreate(schedulesWithEventId);
      }
    }

    if (photoId) {
      const photo = await this.photoModel.findOne({
        where: {
          id: photoId,
          authorId: user.id,
        },
      });
      if (!photo) {
        throw new BadRequestException(await i18n.translate('events.e.notFound.photo'));
      }
      updateObject.photoId = photoId;
    }

    if (dates && dates.length) {
      for (const date of dates) {
        if (!date.from || !date.to) {
          throw new BadRequestException(await i18n.translate('events.e.dates.pair'));
        }

        if (date.from > date.to) {
          throw new BadRequestException(await i18n.translate('events.e.dates.limit'));
        }
      }

      const startFrom = dates.sort((a, b) => (a.from > b.from ? 1 : a.from < b.from ? -1 : 0))[0].from;
      const finishTo = dates.sort((a, b) => (a.to < b.to ? 1 : a.to > b.to ? -1 : 0))[0].to;

      updateObject.startFrom = startFrom;
      updateObject.finishTo = finishTo;

      const datesWithEventId: any = [];
      dates.forEach((date) =>
        datesWithEventId.push({
          eventId: event.id,
          ...date,
        }),
      );

      await this.eventDateModel.destroy({
        where: {
          eventId,
        },
      });

      await EventDate.bulkCreate(datesWithEventId);
    }

    await event.update(updateObject);

    const _event = await this.eventModel.findByPk(eventId, {
      include: [
        {
          model: EventDate,
          attributes: ['from', 'to'],
        },
        {
          model: EventSchedule,
          attributes: ['date', 'daySchedule'],
        },
        {
          model: City,
          attributes: ['id', 'name'],
        },
        {
          model: EventType,
          attributes: ['id', 'name', 'description'],
        },
        {
          model: EventComment,
          attributes: ['id', 'text', 'createdAt'],
        },
        {
          model: Hobbie,
          as: 'hobbies',
          through: {
            attributes: [],
          },
        },
        {
          model: Photo.scope('withAuthor'),
          as: 'photo',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'userType'],
          include: [
            {
              model: Profile,
              attributes: ['name', 'surname'],
              include: [
                {
                  model: Photo,
                },
              ],
            },
          ],
        },
      ],
      attributes: {
        exclude: ['totalAge', 'updatedAt'],
      },
    });

    const members = await event.$get('members', {
      limit: 3,
      attributes: ['id', 'userType'],
      include: [
        {
          model: Profile,
          attributes: ['name', 'surname'],
          include: [
            {
              model: Photo,
            },
          ],
        },
      ],
    });

    const photos = await this.eventPhotoModel.findAndCountAll({
      where: { eventId },
      attributes: [],
      include: [
        {
          model: Photo.scope('withAuthor'),
          as: 'photo',
        },
      ],
      limit: 10,
      order: [['createdAt', 'DESC']],
    });

    const eventJSON: any = _event.toJSON();
    const creatorJSON: any = _event.creator.toJSON();
    const photoJSON: any = _event.photo ? _event.photo.toJSON() : null;

    const photo = _event.photo
      ? {
          ...photoJSON,
          author: {
            id: photoJSON.author.id,
            userType: photoJSON.author.userType,
            ...photoJSON.author.profile,
          },
        }
      : null;

    delete eventJSON.totalAge;
    delete eventJSON.location;

    const photosJSON = photos.rows.map(({ photo }) => {
      const photoJSON: any = photo.toJSON();
      return {
        ...photoJSON,
        author: {
          id: photoJSON.author.id,
          userType: photoJSON.author.userType,
          ...photoJSON.author.profile,
        },
      };
    });

    const membersJSON = members.map((member) => {
      const memberJSON = member.toJSON();
      delete memberJSON.EventMember;
      return {
        ...memberJSON,
      };
    });

    const commentsJSON = _event.comments.map((comment) => {
      const commentJSON = comment.toJSON();
      return {
        ...commentJSON,
        author: creatorJSON,
      };
    });

    const schedulesJSON = _event.schedules
      ? _event.schedules.map((schedule) => {
          const scheduleJSON: any = schedule.toJSON();
          return {
            ...scheduleJSON,
            daySchedule: JSON.parse(scheduleJSON.daySchedule),
          };
        })
      : null;

    if (
      address ||
      (dates && dates.length) ||
      (latitude && longitude) ||
      (event.type.id === eventTypes['Афиша'] && (regulations || (schedules && schedules.length)))
    ) {
      const text = await i18n.translate('events.n.changeInfo');

      this.notifyService.sendNotificationByTopic(
        `event_${eventId}`,
        {
          body: `Организатор изменил информацию в событии ${_event.name}. Перейти к событию?`,
        },
        {
          type: NotificationType.eventText,
          eventId: eventId.toString(),
          title: 'Событие изменено',
          goToEvent: 'true',
        },
      );

      this.notifyService.createNotificationForMembers(_event.id, { text, type: NotificationType.eventText });
    }

    return {
      ...eventJSON,
      creator: creatorJSON,
      latitude: _event.location.latitude,
      longitude: _event.location.longitude,
      photo,
      members: membersJSON,
      photosCount: photos.count,
      photos: photosJSON,
      comments: commentsJSON,
      participationState: EventParticipationState.unavailable,
      schedules: schedulesJSON,
    };
  }

  async deleteEvent(i18n: I18nContext, eventId: number, user: User): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    if (event.creator.id !== user.id) {
      user.hasPermissions(
        [PermissionsNames.admin, PermissionsNames.eventDelete],
        await i18n.translate('events.e.event.delete'),
      );
    }

    await event.destroy();

    this.notifyService.removeMembersFromTopic(eventId);

    return { message: await i18n.translate('events.i.event.delete') };
  }

  async actionEvent(
    i18n: I18nContext,
    eventId: number,
    { action, userId, unpublishReason }: EventActionReqDto,
    user: User,
  ): Promise<MessageDto> {
    if (action === EventAction.enter) {
      return await this.enterEvent(i18n, eventId, user);
    } else if (action === EventAction.leave) {
      return await this.leaveEvent(i18n, eventId, user);
    } else if (action === EventAction.cancel) {
      return await this.cancelEvent(i18n, eventId, user);
    } else if (action === EventAction.block) {
      return await this.blockUser(i18n, eventId, userId, user);
    } else if (action === EventAction.unblock) {
      return await this.unblockUser(i18n, eventId, userId, user);
    } else if (action === EventAction.accept) {
      return await this.acceptUser(i18n, eventId, userId, user);
    } else if (action === EventAction.decline) {
      return await this.declineUser(i18n, eventId, userId, user);
    } else if (action === EventAction.changeOwner) {
      return await this.changeOwner(i18n, eventId, userId, user);
    } else if (action === EventAction.publish) {
      return await this.publishEvent(i18n, eventId, user);
    } else if (action === EventAction.unpublish) {
      return await this.unpublishEvent(i18n, eventId, unpublishReason, user);
    }

    throw new BadRequestException(await i18n.translate('events.e.wrongAction'));
  }

  async getEventMembers(
    i18n: I18nContext,
    eventId: number,
    { state }: EventMemberReqDto,
    user: User,
  ): Promise<EventMemberDto[]> {
    const event = await this.getEvent(i18n, eventId);
    const membersFilters: any = [{ eventId }, { userId: { [Op.ne]: event.creator.id } }];

    if (event.type.id === eventTypes['Закрытое событие'] && event.creator.id !== user.id) {
      const member = await this.eventMemberModel.findOne({
        where: {
          eventId,
          userId: user.id,
          state: EventMemberState.joined,
          isBlocked: false,
        },
      });
      if (!member) {
        user.hasPermissions(
          [PermissionsNames.admin, PermissionsNames.eventMembersGet],
          await i18n.translate('events.e.event.members.get'),
        );
      }
    }

    if (state === EventMemberDtoState.joined) {
      membersFilters.push({
        state: EventMemberState.joined,
        isBlocked: false,
      });
    } else if (state === EventMemberDtoState.pending) {
      membersFilters.push({
        state: EventMemberState.pending,
        isBlocked: false,
      });
    } else if (state === EventMemberDtoState.blocked) {
      membersFilters.push({
        isBlocked: true,
      });
    }

    const rows = await this.eventMemberModel.findAll({
      where: {
        [Op.and]: membersFilters,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'userType'],
          include: [
            {
              model: Profile,
              attributes: ['name', 'surname'],
              include: [
                {
                  model: Photo,
                },
              ],
            },
            {
              model: User,
              as: 'friends',
              through: {
                where: {
                  friendId: user.id,
                  isAccepted: true,
                  isBlocked: null,
                },
                attributes: [],
              },
              attributes: ['id'],
              required: false,
            },
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    const members = rows
      .map(({ user }) => {
        const userJSON = user.toJSON();

        delete userJSON.friends;

        return {
          ...userJSON,
          role: user.friends.length ? EventMemberRole.friend : EventMemberRole.member,
        };
      })
      .sort((a, b) => (a.role === EventMemberRole.friend ? -1 : b.role === EventMemberRole.friend ? 1 : 0));

    members.unshift({
      ...event.creator.toJSON(),
      role: EventMemberRole.creator,
    });

    return members;
  }

  async getEventPhotos(
    i18n: I18nContext,
    eventId: number,
    { offset, limit }: EventPhotoReqDto,
    user: User,
  ): Promise<EventPhotoPagedDto> {
    const event = await this.getEvent(i18n, eventId);

    if (event.type.id === eventTypes['Закрытое событие'] && event.creator.id !== user.id) {
      const member = await this.eventMemberModel.findOne({
        where: {
          eventId,
          userId: user.id,
          state: EventMemberState.joined,
          isBlocked: false,
        },
      });
      if (!member) {
        user.hasPermissions(
          [PermissionsNames.admin, PermissionsNames.eventPhotosGet],
          await i18n.translate('events.e.event.photos.get'),
        );
      }
    }

    const { count, rows } = await this.eventPhotoModel.findAndCountAll({
      where: { eventId },
      include: [
        {
          model: Photo.scope('withAuthor'),
          as: 'photo',
        },
      ],
      distinct: true,
      col: 'photoId',
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const _rows: PhotoWithAuthorDto[] = rows.map(({ photo }) => {
      const photoJSON: any = photo.toJSON();

      return {
        ...photoJSON,
        author: {
          id: photoJSON.author.id,
          userType: photoJSON.author.userType,
          ...photoJSON.author.profile,
        },
      };
    });

    return {
      count,
      photos: _rows,
    };
  }

  async addEventPhotos(
    i18n: I18nContext,
    eventId: number,
    { idArr }: EventPhotoIdsReqDto,
    user: User,
  ): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    if (event.creator.id !== user.id) {
      const member = await this.eventMemberModel.findOne({
        where: {
          eventId,
          userId: user.id,
          state: EventMemberState.joined,
          isBlocked: false,
        },
      });
      if (!member) {
        user.hasPermissions(
          [PermissionsNames.admin, PermissionsNames.eventPhotosAdd],
          await i18n.translate('events.e.event.photos.add'),
        );
      }
    }

    const photos = idArr.map((photoId) => ({
      eventId,
      photoId,
    }));

    if (photos.length) {
      await EventPhoto.bulkCreate(photos);
    }

    return { message: await i18n.translate('events.i.event.photos.add') };
  }

  async getEventComments(i18n: I18nContext, eventId: number, user: User): Promise<EventCommentDto[]> {
    const event = await this.getEvent(i18n, eventId);

    if (event.creator.id !== user.id) {
      const member = await this.eventMemberModel.findOne({
        where: {
          eventId,
          userId: user.id,
          state: EventMemberState.joined,
          isBlocked: false,
        },
      });
      if (!member) {
        user.hasPermissions(
          [PermissionsNames.admin, PermissionsNames.eventCommentsGet],
          await i18n.translate('events.e.event.comments.get'),
        );
      }
    }

    const comments = await this.eventCommentModel.findAll({
      where: { eventId },
      attributes: ['id', 'text', 'createdAt'],
    });

    return comments.map((comment) => {
      const commentJSON: any = comment.toJSON();
      return {
        ...commentJSON,
        author: event.creator,
      };
    });
  }

  async addEventComment(
    i18n: I18nContext,
    eventId: number,
    { text }: EventCommentReqDto,
    user: User,
  ): Promise<EventCommentDto> {
    const event = await this.getEvent(i18n, eventId);

    if (event.creatorId !== user.id) {
      throw new BadRequestException(await i18n.translate('events.e.event.comments.add'));
    }

    const comment = await EventComment.create({
      eventId,
      text,
    });

    const commentJSON: any = comment.toJSON();

    delete commentJSON.updatedAt;
    delete commentJSON.eventId;

    const message = await i18n.translate('events.n.newComment');
    this.notifyService.sendNotificationByTopic(
      `event_${eventId}`,
      {
        body: `Организатор добавил комментарий в событии ${event.name}. Посмотреть?`,
      },
      {
        type: NotificationType.eventText,
        eventId: eventId.toString(),
        title: 'Добавлен комментарий',
        goToEvent: 'true',
      },
    );

    this.notifyService.createNotificationForMembers(eventId, { text: message, type: NotificationType.eventText });

    return {
      ...commentJSON,
      author: event.creator,
    };
  }

  async deleteEventComments(
    i18n: I18nContext,
    eventId: number,
    { idArr }: EventCommentsIdsReqDto,
    user: User,
  ): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    if (event.creator.id !== user.id) {
      user.hasPermissions(
        [PermissionsNames.admin, PermissionsNames.eventCommentsDelete],
        await i18n.translate('events.e.event.comments.delete'),
      );
    }

    await this.eventCommentModel.destroy({
      where: {
        eventId,
        id: idArr,
      },
    });

    return { message: await i18n.translate('events.i.event.comments.delete') };
  }

  async getEventRate(i18n: I18nContext, eventId: number, user: User): Promise<EventRateDto> {
    const event = await this.getEvent(i18n, eventId);

    if (event.state !== EventState.finished) {
      throw new BadRequestException(await i18n.translate('events.e.event.reviews.notFinished'));
    }

    const { count, rows } = await this.eventReviewModel.findAndCountAll({
      where: { eventId },
      attributes: ['rate'],
      distinct: true,
    });

    let rate = 0;

    if (count > 0) {
      rows.forEach((row) => {
        rate += row.rate;
      });
      rate /= count;
    }

    return {
      id: event.id,
      rate,
      countReviews: count,
    };
  }

  async getEventReviews(i18n: I18nContext, eventId: number, user: User): Promise<EventReviewDto[]> {
    const event = await this.getEvent(i18n, eventId);

    if (event.creator.id !== user.id) {
      user.hasPermissions(
        [PermissionsNames.admin, PermissionsNames.eventReviewsGet],
        await i18n.translate('events.e.event.reviews.get'),
      );
    }

    if (event.state !== EventState.finished) {
      throw new BadRequestException(await i18n.translate('events.e.event.reviews.notFinished'));
    }

    const reviews = await this.eventReviewModel.findAll({
      where: { eventId },
      include: [
        {
          model: User,
          attributes: ['id', 'userType'],
          include: [
            {
              model: Profile,
              attributes: ['name', 'surname'],
              include: [
                {
                  model: Photo,
                },
              ],
            },
          ],
        },
      ],
      attributes: ['id', 'text', 'rate', 'createdAt'],
    });

    return reviews.map((review) => {
      const reviewJSON: any = review.toJSON();
      return {
        ...reviewJSON,
        author: review.author.toJSON(),
      };
    });
  }

  async addEventReview(
    i18n: I18nContext,
    eventId: number,
    { rate, text }: EventReviewReqDto,
    user: User,
  ): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    const member = await this.eventMemberModel.findOne({
      where: {
        eventId,
        userId: user.id,
        state: EventMemberState.joined,
        isBlocked: false,
      },
    });
    if (!member) {
      user.hasPermissions(
        [PermissionsNames.admin, PermissionsNames.eventReviewsAdd],
        await i18n.translate('events.e.event.reviews.add'),
      );
    }

    const yetReview = await this.eventReviewModel.findOne({
      where: {
        eventId,
        userId: user.id,
      },
    });
    if (yetReview) {
      throw new BadRequestException(await i18n.translate('events.e.event.reviews.yet'));
    }

    const review = await EventReview.create({
      eventId,
      userId: user.id,
      rate,
      text: event.type.id === eventTypes['Афиша'] ? text : null,
    });

    // Обновляем отзыв в уведомлениях
    this.notifyService.updateNotification(
      {
        actionText: NotificationActionText.accepted,
      },
      {
        userId: user.id,
        eventId,
        actionText: null,
        type: NotificationType.eventReview,
      },
    );

    return { message: await i18n.translate('events.i.event.reviews.add') };
  }

  async enterEvent(i18n: I18nContext, eventId: number, user: User): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    const profile = await user.$get('profile', {
      attributes: ['userId', 'name', 'surname', 'birth'],
    });

    if (event.countMembers + 1 > event.maxMembers) {
      throw new BadRequestException(await i18n.translate('events.e.event.maxMembers'));
    }

    if (event.state === EventState.cancelled) {
      throw new BadRequestException(await i18n.translate('events.e.event.cancelled'));
    }

    if (event.state === EventState.finished) {
      throw new BadRequestException(await i18n.translate('events.e.event.finished'));
    }

    if (event.state !== EventState.actual) {
      throw new BadRequestException(await i18n.translate('events.e.event.notActual'));
    }

    const existingMember = await this.eventMemberModel.findOne({
      where: {
        eventId,
        userId: user.id,
      },
    });

    if (existingMember) {
      if (existingMember.state === EventMemberState.pending) {
        throw new BadRequestException(await i18n.translate('events.e.event.pending'));
      }
      if (existingMember.isBlocked) {
        throw new BadRequestException(await i18n.translate('events.e.event.blocked'));
      }
      throw new BadRequestException(await i18n.translate('events.e.event.yetMember'));
    }

    if (event.type.id === eventTypes['Закрытое событие']) {
      await EventMember.create({
        eventId,
        userId: user.id,
        state: EventMemberState.pending,
      });

      this.notifyService.sendNotification(
        event.creator.id,
        {
          body: await i18n.translate('events.n.enterEvent', {
            args: { event: event.name, name: profile.name, surname: profile.surname },
          }),
        },
        {
          type: NotificationType.eventCloseRequest,
          eventId: eventId.toString(),
          targetUserId: user.id.toString(),
        },
      );

      await this.notifyService.createNotificationForUser({
        userId: event.creator.id,
        targetUserId: user.id,
        eventId,
        type: NotificationType.eventCloseRequest,
      });

      return { message: await i18n.translate('events.i.event.enterPrivate') };
    }

    if (event.type.id === eventTypes['Для друзей']) {
      const friend = await this.userFriendModel.findOne({
        where: {
          userId: event.creator.id,
          friendId: user.id,
          isAccepted: true,
          isBlocked: null,
        },
      });
      if (!friend) {
        throw new BadRequestException(await i18n.translate('events.e.notFriend'));
      }
    }

    await EventMember.create({
      eventId,
      userId: user.id,
      state: EventMemberState.joined,
    });

    await this.updateEventAvgAge(user, event, 'enter');

    await this.crossService.add(eventId, user.id);

    this.notifyService.addOrRemoveFromTopic(user.id, `event_${event.id}`);

    return { message: await i18n.translate('events.i.event.enter') };
  }

  async leaveEvent(i18n: I18nContext, eventId: number, user: User): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    const member = await this.eventMemberModel.findOne({
      where: {
        eventId,
        userId: user.id,
      },
    });

    if (!member) {
      throw new BadRequestException(await i18n.translate('events.e.event.notMember'));
    }

    if (member.state === EventMemberState.pending) {
      await this.eventMemberModel.destroy({
        where: {
          eventId,
          userId: user.id,
        },
      });

      return { message: await i18n.translate('events.i.event.leavePrivate') };
    }

    await this.eventMemberModel.destroy({
      where: {
        eventId,
        userId: user.id,
      },
    });

    await this.updateEventAvgAge(user, event, 'leave');

    await this.crossService.kick(eventId, user.id);

    this.notifyService.addOrRemoveFromTopic(user.id, `event_${event.id}`, false);

    return { message: await i18n.translate('events.i.event.leave') };
  }

  async cancelEvent(i18n: I18nContext, eventId: number, user: User): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    if (event.creatorId !== user.id) {
      user.hasPermissions(
        [PermissionsNames.admin, PermissionsNames.eventCancel],
        await i18n.translate('events.e.event.cancel'),
      );
    }

    if (event.state === EventState.cancelled) {
      throw new BadRequestException(await i18n.translate('events.e.event.alreadyCancel'));
    }

    event.state = EventState.cancelled;

    await event.save();

    const text = await i18n.translate('events.e.event.cancel');
    this.notifyService
      .sendNotificationByTopic(
        `event_${eventId}`,
        {
          body: `Событие ${event.name} отменено организатором`,
        },
        {
          type: NotificationType.eventText,
          eventId: eventId.toString(),
          title: 'Отмена события',
        },
      )
      .then(() => {
        this.notifyService.removeMembersFromTopic(eventId);
        this.notifyService.createNotificationForMembers(eventId, { text, type: NotificationType.eventText });
      });

    return { message: await i18n.translate('events.i.event.cancel') };
  }

  async blockUser(i18n: I18nContext, eventId: number, userId: number, user: User): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    if (event.creatorId !== user.id) {
      user.hasPermissions(
        [PermissionsNames.admin, PermissionsNames.eventMembersBlockUnblock],
        await i18n.translate('events.e.user.block'),
      );
    }

    if (!userId) {
      throw new BadRequestException(await i18n.translate('events.e.notFound.userId'));
    }

    const member = await this.eventMemberModel.findOne({
      where: {
        eventId,
        userId,
      },
    });

    if (!member) {
      throw new BadRequestException(await i18n.translate('events.e.user.notMember'));
    }

    if (member.isBlocked) {
      throw new BadRequestException(await i18n.translate('events.e.user.yetBlocked'));
    }

    member.isBlocked = true;
    await member.save();

    const _user = await this.userModel.findByPk(userId);
    await this.updateEventAvgAge(_user, event, 'leave');

    await this.crossService.kick(eventId, userId);

    this.notifyService.addOrRemoveFromTopic(userId, `event_${eventId}`, false);

    this.notifyService.sendNotification(
      userId,
      {
        body: `Организатор удалил вас из участников события ${event.name}`,
      },
      {
        type: NotificationType.eventText,
        eventId: eventId.toString(),
      },
    );

    this.notifyService.createNotificationForUser({
      userId,
      eventId,
      text: await i18n.translate('events.n.blockUser'),
      type: NotificationType.eventText,
    });

    return { message: await i18n.translate('events.i.user.block') };
  }

  async unblockUser(i18n: I18nContext, eventId: number, userId: number, user: User): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    if (event.creator.id !== user.id) {
      user.hasPermissions(
        [PermissionsNames.admin, PermissionsNames.eventMembersBlockUnblock],
        await i18n.translate('events.e.user.unblock'),
      );
    }

    if (!userId) {
      throw new BadRequestException(await i18n.translate('events.e.notFound.userId'));
    }

    const member = await this.eventMemberModel.findOne({
      where: {
        eventId,
        userId,
      },
    });

    if (!member) {
      throw new BadRequestException(await i18n.translate('events.e.user.notMember'));
    }

    if (!member.isBlocked) {
      throw new BadRequestException(await i18n.translate('events.e.user.yetUnblocked'));
    }

    member.isBlocked = false;
    await member.save();

    const _user = await this.userModel.findByPk(userId);
    await this.updateEventAvgAge(_user, event, 'enter');

    this.notifyService.addOrRemoveFromTopic(userId, `event_${eventId}`);

    return { message: await i18n.translate('events.i.user.unblock') };
  }

  async acceptUser(i18n: I18nContext, eventId: number, userId: number, user: User): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    if (event.creatorId !== user.id) {
      user.hasPermissions(
        [PermissionsNames.admin, PermissionsNames.eventMembersRequest],
        await i18n.translate('events.e.user.accept'),
      );
    }

    if (!userId) {
      throw new BadRequestException(await i18n.translate('events.e.notFound.userId'));
    }

    const member = await this.eventMemberModel.findOne({
      where: {
        eventId,
        userId,
      },
    });

    if (!member) {
      throw new BadRequestException(await i18n.translate('events.e.user.notFound'));
    }

    if (member.state !== EventMemberState.pending) {
      throw new BadRequestException(await i18n.translate('events.e.user.yetMember'));
    }

    const _user = await this.userModel.findByPk(userId);
    await this.updateEventAvgAge(_user, event, 'enter');

    member.state = EventMemberState.joined;

    await member.save();

    await this.crossService.add(eventId, userId);

    // Подписать пользователя на topic события
    this.notifyService.addOrRemoveFromTopic(userId, `event_${eventId}`);

    // Посылаем push для участника
    this.notifyService.sendNotification(
      userId,
      {
        body: `Теперь Вы стали участником события ${event.name}`,
      },
      {
        type: NotificationType.eventText,
        eventId: eventId.toString(),
        title: 'Заявка одобрена',
      },
    );

    // Создаем оповещения в БД для участника
    this.notifyService.createNotificationForUser({
      userId,
      eventId,
      type: NotificationType.eventText,
      text: await i18n.translate('events.n.accepted'),
    });

    // Обновляем статус заявки в оповещении для автора события
    this.notifyService.updateNotification(
      {
        actionText: NotificationActionText.accepted,
      },
      {
        eventId,
        targetUserId: userId,
        actionText: null,
        type: NotificationType.eventCloseRequest,
      },
    );

    return { message: await i18n.translate('events.i.user.accepted') };
  }

  async declineUser(i18n: I18nContext, eventId: number, userId: number, user: User): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    if (event.creatorId !== user.id) {
      user.hasPermissions(
        [PermissionsNames.admin, PermissionsNames.eventMembersRequest],
        await i18n.translate('events.e.user.decline'),
      );
    }

    if (!userId) {
      throw new BadRequestException(await i18n.translate('events.e.notFound.userId'));
    }

    const member = await this.eventMemberModel.findOne({
      where: {
        eventId,
        userId,
      },
    });

    if (!member) {
      throw new BadRequestException(await i18n.translate('events.e.user.notFound'));
    }

    if (member.state !== EventMemberState.pending) {
      throw new BadRequestException(await i18n.translate('events.e.user.yetMember'));
    }

    await member.destroy();

    // Посылаем push для участника
    this.notifyService.sendNotification(
      userId,
      {
        body: `Заявка на участие в ${event.name} отклонена`,
      },
      {
        type: NotificationType.eventText,
        eventId: eventId.toString(),
      },
    );

    // Создаем оповещения в БД для участника
    this.notifyService.createNotificationForUser({
      userId,
      eventId,
      type: NotificationType.eventText,
      text: await i18n.translate('events.n.declined'),
    });

    // Обновляем статус заявки в оповещении для автора события
    this.notifyService.updateNotification(
      {
        actionText: NotificationActionText.declined,
      },
      {
        eventId,
        targetUserId: userId,
        actionText: null,
        type: NotificationType.eventCloseRequest,
      },
    );

    return { message: await i18n.translate('events.i.user.declined') };
  }

  async changeOwner(i18n: I18nContext, eventId: number, userId: number, user: User): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    user.hasPermissions(
      [PermissionsNames.admin, PermissionsNames.eventChangeOwner],
      await i18n.translate('events.e.event.changeOwner'),
    );

    if (!userId) {
      throw new BadRequestException(await i18n.translate('events.e.notFound.orgId'));
    }

    if (userId === event.creator.id) {
      throw new BadRequestException(await i18n.translate('events.e.event.sameOrg'));
    }

    const newUser = await this.userModel.findByPk(userId);

    if (!newUser) {
      throw new BadRequestException(await i18n.translate('events.e.notFound.org'));
    }

    event.creator = newUser;
    event.creatorId = userId;

    await event.save();

    return { message: await i18n.translate('events.i.event.changeOwner') };
  }

  async publishEvent(i18n: I18nContext, eventId: number, user: User): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    if (event.creatorId !== user.id) {
      user.hasPermissions(
        [PermissionsNames.admin, PermissionsNames.eventPublishUnpublish],
        await i18n.translate('events.e.event.publishEvent'),
      );
    }

    if (event.state !== EventState.unpublished) {
      throw new BadRequestException(await i18n.translate('events.e.event.publishOnlyUnpublished'));
    }

    if (event.type.id !== eventTypes['Афиша']) {
      throw new BadRequestException(await i18n.translate('events.e.event.publishOnlyMassEvent'));
    }

    event.state = EventState.actual;
    event.unpublishReason = null;

    await event.save();

    const message = await i18n.translate('events.i.event.publishEvent');

    this.notifyService.sendNotificationByTopic(
      `event_${eventId}`,
      {
        body: `Событие ${event.name} опубликовано`,
      },
      {
        type: NotificationType.eventText,
        eventId: eventId.toString(),
      },
    );

    this.notifyService.createNotificationForMembers(eventId, {
      type: NotificationType.eventText,
      text: message,
    });

    return { message };
  }

  async unpublishEvent(i18n: I18nContext, eventId: number, unpublishReason: string, user: User): Promise<MessageDto> {
    const event = await this.getEvent(i18n, eventId);

    user.hasPermissions(
      [PermissionsNames.admin, PermissionsNames.eventPublishUnpublish],
      await i18n.translate('events.e.event.unpublishEvent'),
    );

    if (event.state !== EventState.actual) {
      throw new BadRequestException(await i18n.translate('events.e.event.unpublishOnlyActual'));
    }

    if (event.type.id !== eventTypes['Афиша']) {
      throw new BadRequestException(await i18n.translate('events.e.event.unpublishOnlyMassEvent'));
    }

    event.state = EventState.unpublished;
    event.unpublishReason = unpublishReason;

    await event.save();

    const message = await i18n.translate('events.i.event.unpublishEvent');

    this.notifyService.sendNotificationByTopic(
      `event_${eventId}`,
      {
        body: `Событие ${event.name} снято с публикации`,
      },
      {
        type: NotificationType.eventText,
        eventId: eventId.toString(),
      },
    );

    this.notifyService.createNotificationForMembers(eventId, {
      type: NotificationType.eventText,
      text: message,
    });

    return { message };
  }

  async updateEventAvgAge(user: User, event: Event, action: 'enter' | 'leave') {
    if (!user || !event || !action) {
      return;
    }

    const profile = await user.$get('profile', {
      attributes: ['userId', 'name', 'surname', 'birth'],
    });

    if (!profile || !profile.birth) {
      return;
    }

    const userAge = moment().diff(profile.birth, 'years');

    if (action === 'enter') {
      event.totalAge += userAge;
      if (event.countMembers < 0) event.countMembers = 0;
      event.countMembers++;
      event.averageAge = Math.round(event.totalAge / event.countMembers);
    } else if (action === 'leave') {
      event.countMembers--;
      if (event.countMembers < 0) event.countMembers = 0;

      if (event.countMembers > 0) {
        event.totalAge -= userAge;
        if (event.totalAge < 0) event.totalAge = 0;
        event.averageAge = event.countMembers === 0 ? 0 : Math.round(event.totalAge / event.countMembers);
      } else {
        event.totalAge = 0;
        event.averageAge = 0;
      }
    }

    await event.save();
  }

  async getEvent(i18n: I18nContext, eventId: number): Promise<Event> {
    if (!eventId) {
      throw new BadRequestException(await i18n.translate('events.e.notFound.event'));
    }

    const event = await this.eventModel.findByPk(eventId, {
      attributes: {
        include: ['id', 'name', 'creatorId', 'photoId', 'maxMembers'],
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'userType'],
          include: [
            {
              model: Profile,
              attributes: ['name', 'surname'],
              include: [
                {
                  model: Photo,
                },
              ],
            },
          ],
        },
        {
          model: EventType,
          attributes: ['id', 'name'],
        },
      ],
    });
    if (!event) {
      throw new BadRequestException(await i18n.translate('events.e.notFound.event'));
    }

    return event;
  }
}
