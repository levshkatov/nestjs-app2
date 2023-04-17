import {
  IsNotEmpty,
  Min,
  IsNumber,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsDate,
  ValidateNested,
  IsString,
  IsLongitude,
  IsLatitude,
  Max,
  IsEnum,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { EventState } from '../../models/event.model';
import { PhotoWithAuthorDto } from '../../dto/photo.dto';
import { CityDto } from '../../dto/city.dto';
import { MiniUserWithPhotoDto } from '../../dto/miniUser.dto';
import { HobbieDto } from '../../dto/hobbie.dto';
import { EventTypeDto } from './event-type.dto';
import { EventCommentDto } from './event-comment.dto';
import { EventScheduleDto, EventScheduleReqDto } from './event-schedule.dto';
import { EventDateDto, EventDateReqDto } from './event-date.dto';
import { PaginationReqDto } from '../../dto/pagination.dto';

export enum EventParticipationState {
  available = 'available',
  pending = 'pending',
  joined = 'joined',
  unavailable = 'unavailable',
  blocked = 'blocked',
}

// createEvent, editEvent, getEventById
export class EventDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: EventState })
  state: EventState;

  @ApiProperty({ enum: EventParticipationState })
  participationState: EventParticipationState;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: PhotoWithAuthorDto })
  photo: PhotoWithAuthorDto;

  @ApiProperty()
  address: string;

  @ApiProperty({ format: 'double' })
  longitude: number;

  @ApiProperty({ format: 'double' })
  latitude: number;

  @ApiProperty({ type: CityDto })
  city: CityDto;

  @ApiProperty()
  maxMembers: number;

  @ApiProperty()
  countMembers: number;

  @ApiProperty()
  averageAge: number;

  @ApiProperty()
  countEdits: number;

  @ApiProperty({ type: MiniUserWithPhotoDto })
  creator: MiniUserWithPhotoDto;

  @ApiProperty({ type: [MiniUserWithPhotoDto] })
  members: MiniUserWithPhotoDto[];

  @ApiProperty({ type: [EventDateDto] })
  dates: EventDateDto[];

  @ApiProperty({ type: [HobbieDto] })
  hobbies: HobbieDto[];

  @ApiProperty({ description: 'Общее число фотографий события' })
  photosCount: number;

  @ApiProperty({ type: [PhotoWithAuthorDto], description: 'Максимум 10 первых фотографий' })
  photos: PhotoWithAuthorDto[];

  @ApiProperty({ type: EventTypeDto })
  type: EventTypeDto;

  @ApiProperty({ type: [EventCommentDto], description: 'Все комментарии события' })
  comments: EventCommentDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  startFrom: Date;

  @ApiProperty()
  finishTo: Date;

  @ApiProperty()
  regulations: string | null;

  @ApiProperty()
  site: string | null;

  @ApiProperty()
  isFree: boolean | null;

  @ApiProperty()
  registrationLink: string | null;

  @ApiProperty({ type: [EventScheduleDto] })
  schedules: EventScheduleDto[] | null;

  @ApiProperty()
  unpublishReason: string | null;
}

export class EventPartialDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: EventState })
  state: EventState;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: PhotoWithAuthorDto })
  photo: PhotoWithAuthorDto;

  @ApiProperty()
  address: string;

  @ApiProperty({ format: 'double' })
  longitude: number;

  @ApiProperty({ format: 'double' })
  latitude: number;

  @ApiProperty({ type: CityDto })
  city: CityDto;

  @ApiProperty()
  maxMembers: number;

  @ApiProperty()
  countMembers: number;

  @ApiProperty()
  averageAge: number;

  @ApiProperty({ type: MiniUserWithPhotoDto })
  creator: MiniUserWithPhotoDto;

  @ApiProperty({ type: [EventDateDto] })
  dates: EventDateDto[];

  @ApiProperty({ type: [HobbieDto] })
  hobbies: HobbieDto[];

  @ApiProperty({ type: EventTypeDto })
  type: EventTypeDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  startFrom: Date;

  @ApiProperty()
  finishTo: Date;
}

// getEvents, getEventsFeed,
export class EventPagedDto {
  @ApiProperty({ description: 'Общее число найденных событий' })
  count: number;

  @ApiProperty({ type: [EventPartialDto] })
  events: EventPartialDto[];
}

export enum EventReqType {
  created = 'created',
  actual = 'actual',
  history = 'history',
}

export enum EventReqStatus {
  actual = 'actual',
  finished = 'finished',
  cancelled = 'cancelled',
  unpublished = 'unpublished',
}

// createEvent
export class EventCreateReqDto {
  @ApiProperty({
    example: 'Событие 1',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 1,
  })
  @IsNotEmpty()
  photoId: number;

  @ApiPropertyOptional({
    example: 'Описание 1',
  })
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  cityId: number;

  @ApiProperty({
    example: 'Москва, ул. Красноармейская 105',
  })
  @IsNotEmpty()
  address: string;

  @ApiProperty({ format: 'double', example: 37.6 })
  @IsLongitude()
  longitude: number;

  @ApiProperty({ format: 'double', example: 55.6 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ type: [EventDateReqDto] })
  @IsArray()
  @ValidateNested()
  @ArrayMinSize(1)
  @Type(() => EventDateReqDto)
  dates: EventDateReqDto[];

  @ApiProperty({
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  typeId: number;

  @ApiProperty({
    example: [4],
    type: [Number],
  })
  @Type(() => Number)
  @IsNumber({}, { each: true })
  hobbiesIds: number[];

  @ApiPropertyOptional({
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxMembers: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isFree: boolean | null;

  @ApiPropertyOptional({ example: 'Regulations text' })
  @IsOptional()
  regulations: string | null;

  @ApiPropertyOptional({ example: 'https://al.itis.team/event' })
  @IsOptional()
  site: string | null;

  @ApiPropertyOptional({ example: 'https://al.itis.team/event/signup' })
  @IsOptional()
  registrationLink: string | null;

  @ApiPropertyOptional({
    example: [
      {
        date: '2020-12-21T00:00:00.000Z',
        daySchedule: [
          {
            name: 'Лекция 1',
            time: '2020-12-21T12:00:00.000Z',
          },
        ],
      },
    ],
    type: [EventScheduleReqDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => EventScheduleReqDto)
  schedules: EventScheduleReqDto[];
}

// editEvent
export class EventEditReqDto {
  @ApiPropertyOptional()
  @IsOptional()
  photoId: number;

  @ApiPropertyOptional()
  @IsOptional()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxMembers: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countEdits: number;

  @ApiPropertyOptional({ format: 'double' })
  @IsOptional()
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ format: 'double' })
  @IsOptional()
  @IsLatitude()
  latitude: number;

  @ApiPropertyOptional({ type: [EventDateReqDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @ArrayMinSize(1)
  @Type(() => EventDateReqDto)
  dates: EventDateReqDto[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isFree: boolean | null;

  @ApiPropertyOptional({ example: 'Regulations text' })
  @IsOptional()
  regulations: string | null;

  @ApiPropertyOptional({ example: 'https://al.itis.team/event' })
  @IsOptional()
  site: string | null;

  @ApiPropertyOptional({ example: 'https://al.itis.team/event/signup' })
  @IsOptional()
  registrationLink: string | null;

  @ApiPropertyOptional({
    example: [
      {
        date: '2020-12-21T00:00:00.000Z',
        daySchedule: [
          {
            name: 'Лекция 1',
            time: '2020-12-21T12:00:00.000Z',
          },
        ],
      },
    ],
    type: [EventScheduleReqDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @ArrayMinSize(1)
  @Type(() => EventScheduleReqDto)
  schedules: EventScheduleReqDto[];
}

// getEvents
export class EventsReqDto extends PaginationReqDto {
  @ApiPropertyOptional({
    description: 'Id пользователя. По умолчанию - авторизованный пользователь',
  })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @ApiPropertyOptional({
    description: 'Тип событий. По умолчанию - актуальные. Для поиска в ЛК нужен created',
    enum: EventReqType,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(EventReqType)
  type: EventReqType = EventReqType.actual;

  @ApiPropertyOptional({
    description: 'Id города. Для ЛК',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  cityId: number;

  @ApiPropertyOptional({
    description: 'Статус событий. Для ЛК',
    enum: EventReqStatus,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(EventReqStatus)
  status: EventReqStatus;

  @ApiPropertyOptional({
    example: [],
    description: 'Массив id увлечений. Для ЛК',
    type: [Number],
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @IsNotEmpty()
  hobbiesIds: number | number[];

  @ApiPropertyOptional({
    description: 'Минимум участников. Для ЛК',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  membersFrom: number;

  @ApiPropertyOptional({
    description: 'Максимум участников. Для ЛК',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  membersTo: number;

  @ApiPropertyOptional({
    description: 'Дата начала (2020-09-21T14:48:23). Для ЛК',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateFrom: Date;

  @ApiPropertyOptional({
    description: 'Дата окончания (2020-09-21T14:48:23). Для ЛК',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateTo: Date;

  @ApiPropertyOptional({
    description: 'Поиск по названию. Для ЛК',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search: string;

  @ApiPropertyOptional({
    format: 'double',
  })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  @IsNotEmpty()
  minLatitude: number;

  @ApiPropertyOptional({
    format: 'double',
  })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  @IsNotEmpty()
  minLongitude: number;

  @ApiPropertyOptional({
    format: 'double',
  })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  @IsNotEmpty()
  maxLatitude: number;

  @ApiPropertyOptional({
    format: 'double',
  })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  @IsNotEmpty()
  maxLongitude: number;
}

// getEventsFeed
export class EventsFeedReqDto extends PaginationReqDto {
  @ApiPropertyOptional({
    description: 'Id города',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  cityId: number;

  @ApiPropertyOptional({
    description: 'Координаты местоположения - широта (55.6)',
    format: 'double',
  })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  @IsNotEmpty()
  latitude: number;

  @ApiPropertyOptional({
    description: 'Координаты местоположения - долгота (37.6)',
    format: 'double',
  })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  @IsNotEmpty()
  longitude: number;

  @ApiPropertyOptional({
    description: 'Радиус поиска в км (1-100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsNotEmpty()
  radius: number;

  @ApiPropertyOptional({
    example: [],
    description: 'Массив id увлечений',
    type: [Number],
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @IsNotEmpty()
  hobbiesIds: number | number[];

  @ApiPropertyOptional({
    description: 'Минимум участников',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  membersFrom: number;

  @ApiPropertyOptional({
    description: 'Максимум участников',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  membersTo: number;

  @ApiPropertyOptional({
    example: [],
    description: 'Массив id типов события',
    type: [Number],
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @IsNotEmpty()
  eventTypeIds: number | number[];

  @ApiPropertyOptional({
    description: 'Минимальный возраст',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  ageFrom: number;

  @ApiPropertyOptional({
    description: 'Максимальный возраст',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  ageTo: number;

  @ApiPropertyOptional({
    description: 'Дата начала (2020-09-21T14:48:23)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateFrom: Date;

  @ApiPropertyOptional({
    description: 'Дата окончания (2020-09-21T14:48:23)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateTo: Date;

  @ApiPropertyOptional({
    description: 'Поиск по названию',
  })
  @IsOptional()
  @IsString()
  search: string;

  @ApiPropertyOptional({
    description: 'Только бесплатные',
  })
  @IsOptional()
  @Transform((x) => (x == 'true' ? true : false))
  onlyFree: boolean;

  @ApiPropertyOptional({
    format: 'double',
  })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  @IsNotEmpty()
  minLatitude: number;

  @ApiPropertyOptional({
    format: 'double',
  })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  @IsNotEmpty()
  minLongitude: number;

  @ApiPropertyOptional({
    format: 'double',
  })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  @IsNotEmpty()
  maxLatitude: number;

  @ApiPropertyOptional({
    format: 'double',
  })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  @IsNotEmpty()
  maxLongitude: number;
}

export class EventsAllReqDto extends EventsFeedReqDto {
  @ApiPropertyOptional({
    description: 'Статус событий',
    enum: EventReqStatus,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(EventReqStatus)
  status: EventReqStatus;
}
