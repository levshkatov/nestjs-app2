import { Table, ForeignKey, Column, Model, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

@Table
export class UserFriend extends Model<UserFriend> {
  @ForeignKey(() => User)
  @Column
  userId: number;

  @ForeignKey(() => User)
  @Column
  friendId: number;

  @BelongsTo(() => User, 'friendId')
  friend: User;

  @Column
  isAccepted: boolean;

  @Column
  isBlocked: boolean;
}

export type FriendshipStatus = 'notFriend' | 'friend' | 'pending' | 'blocked' | 'youBlocked';
