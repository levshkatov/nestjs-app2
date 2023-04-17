import * as bcrypt from 'bcrypt';
import {
  AllowNull,
  BelongsToMany,
  Column,
  DataType,
  Default,
  DefaultScope,
  HasMany,
  HasOne,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Hobbie } from './hobbie.model';
import { Permission } from './permission.model';
import { Profile } from './profile.model';
import { Setting } from './setting.model';
import { UserHobbie } from './userHobbie.model';
import { UserPermission } from './userPermission.model';
import { UserFriend } from './userFriend.model';
import { Event } from './event.model';
import { EventMember } from './eventMember.model';
import { UserSubscription } from './userSubscription.model';
import { Photo } from './photo.model';
import { ForbiddenException } from '@nestjs/common';
import { EventReview } from './eventReview.model';

export enum UserTypes {
  user = 'user',
  manager = 'manager',
  admin = 'admin',
}

@DefaultScope(() => ({
  attributes: {
    exclude: ['password', 'resetToken', 'resetTokenExpireAt', 'updatedAt', 'firebaseId', 'vkId'],
  },
  where: {
    isBlocked: null,
  },
}))
@Table({
  paranoid: true,
})
export class User extends Model<User> {
  id: number;

  @Unique
  @AllowNull
  @Column
  phone: string;

  @Unique
  @AllowNull
  @Column
  email: string;

  @Column
  set password(value: string) {
    if (value == null) this.setDataValue('password', null);
    else this.setDataValue('password', bcrypt.hashSync(value, bcrypt.genSaltSync(10)));
  }

  @AllowNull
  @Column
  resetToken: string;

  @AllowNull
  @Column
  resetTokenExpireAt: Date;

  @AllowNull
  @Column
  isBlocked: boolean;

  @HasOne(() => Profile, 'userId')
  profile: Profile;

  @HasOne(() => Setting, 'userId')
  settings: Setting;

  @Default('user')
  @Column(DataType.ENUM(...Object.values(UserTypes)))
  userType: UserTypes;

  @BelongsToMany(() => Permission, () => UserPermission)
  permissions: Permission[];

  @BelongsToMany(() => Hobbie, () => UserHobbie)
  hobbies: Hobbie[];

  @BelongsToMany(() => User, {
    through: () => UserFriend,
    foreignKey: 'friendId',
    otherKey: 'userId',
  })
  following: User[];

  @BelongsToMany(() => User, {
    through: () => UserFriend,
    foreignKey: 'userId',
    otherKey: 'friendId',
  })
  friends: User[];

  @BelongsToMany(() => User, {
    through: () => UserSubscription,
    foreignKey: 'userId',
    otherKey: 'subscriptionId',
  })
  subscriptions: User[];

  @HasMany(() => Photo, 'authorId')
  photos: Photo[];

  @BelongsToMany(() => Event, () => EventMember)
  events: Event[];

  @HasMany(() => EventReview, 'userId')
  reviews: EventReview[];

  // socials
  @Column
  firebaseId: string;

  @Column
  vkId: string;

  public checkPassword(password: string): boolean {
    return bcrypt.compareSync(password, this.password);
  }

  public hasPermissions(
    permissions: string[],
    errorMessage: string | null = null,
    type: 'some' | 'every' = 'some',
  ): boolean {
    const userPermissions = this.permissions.map((p) => p.name);
    const canUser = permissions[type]((p) => userPermissions.includes(p));

    if (!canUser && errorMessage) {
      throw new ForbiddenException(errorMessage);
    }

    return canUser;
  }

  toJSON() {
    const user: any = super.toJSON();
    delete user.updatedAt;

    if (!user.profile) return user;

    const profile: any = this.profile.toJSON();
    delete user.profile;
    delete profile.photoId;

    return { ...user, ...profile };
  }
}
