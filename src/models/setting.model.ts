import { Model, Table, Column, AllowNull, PrimaryKey, ForeignKey, DefaultScope, Default } from 'sequelize-typescript';
import { User } from './user.model';

export enum UserSettingNames {
  pushInterestingEvents = 'pushInterestingEvents',
  pushRemindTreeDays = 'pushRemindTreeDays',
  pushRemindOneDay = 'pushRemindOneDay',
  pushRemindOnFinish = 'pushRemindOnFinish',
  pushRemindOnFriends = 'pushRemindOnFriends',
  pushGroup = 'pushGroup',
  pushGroupSound = 'pushGroupSound',
  pushPrivateFriends = 'pushPrivateFriends',
  pushPrivateAll = 'pushPrivateAll',
  pushPrivateSound = 'pushPrivateSound',
  emailInterestingEvents = 'emailInterestingEvents',
  emailRemindTreeDays = 'emailRemindTreeDays',
  emailRemindOneDay = 'emailRemindOneDay',
  emailRemindOnFinish = 'emailRemindOnFinish',
}

@DefaultScope(() => ({
  attributes: {
    exclude: ['userId', 'createdAt', 'updatedAt'],
  },
}))
@Table
export class Setting extends Model<Setting> {
  @PrimaryKey
  @ForeignKey(() => User)
  @Column
  userId: number;

  @AllowNull
  @Default(true)
  @Column
  pushInterestingEvents: boolean;

  @AllowNull
  @Default(true)
  @Column
  pushRemindTreeDays: boolean;

  @AllowNull
  @Default(true)
  @Column
  pushRemindOneDay: boolean;

  @AllowNull
  @Default(true)
  @Column
  pushRemindOnFinish: boolean;

  @AllowNull
  @Default(true)
  @Column
  pushRemindOnFriends: boolean;

  @AllowNull
  @Default(true)
  @Column
  pushGroup: boolean;

  @AllowNull
  @Default(true)
  @Column
  pushGroupSound: boolean;

  @AllowNull
  @Default(true)
  @Column
  pushPrivateFriends: boolean;

  @AllowNull
  @Default(true)
  @Column
  pushPrivateAll: boolean;

  @AllowNull
  @Default(true)
  @Column
  pushPrivateSound: boolean;

  @AllowNull
  @Default(true)
  @Column
  emailInterestingEvents: boolean;

  @AllowNull
  @Default(true)
  @Column
  emailRemindTreeDays: boolean;

  @AllowNull
  @Default(true)
  @Column
  emailRemindOneDay: boolean;

  @AllowNull
  @Default(true)
  @Column
  emailRemindOnFinish: boolean;

  toJSON() {
    const result: any = super.toJSON();
    delete result.userId;
    delete result.createdAt;
    delete result.updatedAt;
    return result;
  }
}
