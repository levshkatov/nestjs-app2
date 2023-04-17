import { Table, Model, Column, DataType, BelongsTo, AllowNull, Default, DefaultScope } from 'sequelize-typescript';
import { SupportTitle } from './supportTitle.model';
import { User } from './user.model';
import { Event } from './event.model';

export enum SupportStatus {
  notViewed = 'notViewed',
  viewed = 'viewed',
  resolved = 'resolved',
}

export enum SupportType {
  event = 'event',
  user = 'user',
  other = 'other',
}

@DefaultScope(() => ({
  attributes: {
    exclude: ['userId', 'targetUserId', 'titleId', 'eventId', 'updatedAt'],
  },
}))
@Table
export class Support extends Model<Support> {
  @BelongsTo(() => User, 'userId')
  user: User;

  @AllowNull
  @Column
  email: string;

  @BelongsTo(() => Event, 'eventId')
  event: Event;

  @BelongsTo(() => User, 'targetUserId')
  targetUser: User;

  @BelongsTo(() => SupportTitle, 'titleId')
  title: SupportTitle;

  @Column(DataType.TEXT)
  text: string;

  @Default(SupportStatus.notViewed)
  @Column(DataType.ENUM(...Object.values(SupportStatus)))
  status: SupportStatus;

  @Column(DataType.JSONB)
  files: string[];

  toJSON() {
    const support: any = super.toJSON();

    const user: any = this.user?.toJSON();
    const event: any = this.event?.toJSON();
    const targetUser: any = this.targetUser?.toJSON();

    return { ...support, user, targetUser, event };
  }
}
