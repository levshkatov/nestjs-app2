import { Table, Model, Column, ForeignKey, BelongsTo, DefaultScope, DataType } from 'sequelize-typescript';
import { Event } from './event.model';
import { User } from './user.model';

export enum NotificationType {
  eventText = 'eventText',
  friendRequest = 'friendRequest',
  friendAccepted = 'friendAccepted',
  eventCloseRequest = 'eventCloseRequest',
  eventForFriends = 'eventForFriends',
  birthday = 'birthday',
  eventFromManager = 'eventFromManager',
  eventReview = 'eventReview',
  eventReviewWithText = 'eventReviewWithText',
}

export enum NotificationActionText {
  accepted = 'accepted',
  declined = 'declined',
}

@DefaultScope(() => ({
  attributes: {
    exclude: ['userId', 'eventId', 'targetUserId', 'updatedAt'],
  },
}))
@Table
export class Notification extends Model<Notification> {
  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  user: User;

  @Column
  text: string;

  @Column(DataType.ENUM(...Object.values(NotificationActionText)))
  actionText: NotificationActionText;

  @ForeignKey(() => Event)
  @Column
  eventId: number;

  @BelongsTo(() => Event, {
    foreignKey: 'eventId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  event: Event;

  @ForeignKey(() => User)
  @Column
  targetUserId: number;

  @BelongsTo(() => User, {
    foreignKey: 'targetUserId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  targetUser: User;

  @Column(DataType.ENUM(...Object.values(NotificationType)))
  type: NotificationType;

  toJSON() {
    const notify: any = super.toJSON();
    const event: any = this.event?.toJSON();
    const targetUser: any = this.targetUser?.toJSON();

    return { ...notify, event, targetUser };
  }
}
