import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
  Default,
  BelongsToMany,
  DefaultScope,
  HasMany,
  ForeignKey,
} from 'sequelize-typescript';
import { Location } from '../dto/location.dto';
import { City } from './city.model';
import { User } from './user.model';
import { EventType } from './eventType.model';
import { EventHobbie } from './eventHobbie.model';
import { Hobbie } from './hobbie.model';
import { EventMember } from './eventMember.model';
import { EventComment } from './eventComment.model';
import { EventPhoto } from './eventPhoto.model';
import { EventDate } from './eventDates.model';
import { Photo } from './photo.model';
import { EventSchedule } from './eventSchedule.model';
import { EventReview } from './eventReview.model';

export enum EventState {
  actual = 'actual',
  finished = 'finished',
  cancelled = 'cancelled',
  unpublished = 'unpublished',
}

@DefaultScope(() => ({
  attributes: {
    exclude: ['cityId', 'typeId', 'creatorId', 'photoId'],
  },
}))
@Table
export class Event extends Model<Event> {
  @Column
  name: string;

  @Column({ type: DataType.TEXT })
  description: string;

  @Column
  address: string;

  @Column({ type: DataType.GEOMETRY('POINT') })
  get location(): Location {
    const value: any = this.getDataValue('location');
    if (!value) return null;
    return { longitude: value.coordinates[0], latitude: value.coordinates[1] };
  }
  set location(value: Location) {
    if (value == null || value.latitude == null || value.longitude == null) this.setDataValue('location', null);
    else
      this.setDataValue('location', {
        type: 'POINT',
        coordinates: [value.longitude, value.latitude],
      } as any);
  }

  @Column
  maxMembers: number;

  @Default(0)
  @Column
  countMembers: number;

  @Default(0)
  @Column
  totalAge: number;

  @Default(0)
  @Column
  averageAge: number;

  @Default(0)
  @Column
  countEdits: number;

  @Default('actual')
  @Column(DataType.ENUM(...Object.values(EventState)))
  state: EventState;

  @AllowNull
  @Column
  isFree: boolean;

  @AllowNull
  @Column({ type: DataType.TEXT })
  regulations: string;

  @AllowNull
  @Column({ type: DataType.TEXT })
  site: string;

  @AllowNull
  @Column({ type: DataType.TEXT })
  registrationLink: string;

  @AllowNull
  @Column({ type: DataType.TEXT })
  unpublishReason: string;

  @Column({ type: DataType.DATE })
  startFrom: Date;

  @Column({ type: DataType.DATE })
  finishTo: Date;

  @ForeignKey(() => Photo)
  @Column
  photoId: number;

  @BelongsTo(() => Photo, 'photoId')
  photo: Photo;

  @BelongsTo(() => City, 'cityId')
  city: City;

  @ForeignKey(() => User)
  @Column
  creatorId: number;

  @BelongsTo(() => User, 'creatorId')
  creator: User;

  @BelongsTo(() => EventType, 'typeId')
  type: EventType;

  @BelongsToMany(() => Hobbie, () => EventHobbie)
  hobbies: Hobbie[];

  @BelongsToMany(() => User, () => EventMember)
  members: User[];

  @HasMany(() => EventComment, 'eventId')
  comments: EventComment[];

  @BelongsToMany(() => Photo, () => EventPhoto)
  photos: Photo[];

  @HasMany(() => EventDate, 'eventId')
  dates: EventDate[];

  @HasMany(() => EventSchedule, 'eventId')
  schedules: EventSchedule[];

  @HasMany(() => EventReview, 'eventId')
  reviews: EventReview[];
}
