import { Table, Column, Model, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Event } from './event.model';
import { Photo } from './photo.model';

@Table
export class EventPhoto extends Model<EventPhoto> {
  @ForeignKey(() => Event)
  @Column
  eventId: number;

  @ForeignKey(() => Photo)
  @Column
  photoId: number;

  @BelongsTo(() => Photo, 'photoId')
  photo: Photo;
}
