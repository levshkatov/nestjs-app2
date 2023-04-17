import { Table, ForeignKey, Column, Model, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';
import { Permission } from './permission.model';

@Table
export class UserPermission extends Model<UserPermission> {
  @ForeignKey(() => User)
  @Column
  userId: number;

  @ForeignKey(() => Permission)
  @Column
  permissionId: number;

  @BelongsTo(() => Permission)
  permission: Permission;
}
