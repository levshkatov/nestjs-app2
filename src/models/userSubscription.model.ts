import { Table, ForeignKey, Column, Model, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

@Table
export class UserSubscription extends Model<UserSubscription> {
  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User, 'userId')
  user: User;

  @ForeignKey(() => User)
  @Column
  subscriptionId: number;

  @BelongsTo(() => User, 'subscriptionId')
  subscription: User;
}

export type SubscriptionStatus = 'notSubscribed' | 'subscribed' | 'youBlocked' | 'blocked';
