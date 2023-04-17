import { Table, Column, Model, ForeignKey, DataType, BelongsTo, AllowNull } from 'sequelize-typescript';
import { Event } from './event.model';
import { User } from './user.model';

@Table
export class EventReview extends Model<EventReview> {
  @ForeignKey(() => Event)
  @Column
  eventId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @AllowNull
  @Column(DataType.TEXT)
  text: string;

  @Column
  rate: number;

  @BelongsTo(() => User)
  author: User;

  @BelongsTo(() => Event)
  event: Event;
}
