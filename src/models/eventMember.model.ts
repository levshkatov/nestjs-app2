import { Table, ForeignKey, Column, Model, BelongsTo, DataType, Default } from 'sequelize-typescript';
import { Event } from './event.model';
import { User } from './user.model';

export enum EventMemberState {
  joined = 'joined',
  pending = 'pending',
}

@Table
export class EventMember extends Model<EventMember> {
  @ForeignKey(() => Event)
  @Column
  eventId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @Default('joined')
  @Column(DataType.ENUM(...Object.values(EventMemberState)))
  state: EventMemberState;

  @Default(false)
  @Column
  isBlocked: boolean;

  @BelongsTo(() => User)
  user: User;
}
