import { Column, Model, Table, PrimaryKey, BelongsTo } from 'sequelize-typescript';
import { Setting } from './setting.model';
import { User } from './user.model';

@Table
export class UserFcm extends Model<UserFcm> {
  @PrimaryKey
  @Column
  token: string;

  @BelongsTo(() => User, { as: 'user', foreignKey: 'userId' })
  user: User;
  userId: number;

  @BelongsTo(() => Setting, { as: 'setting', foreignKey: 'userId' })
  setting: Setting;
}
