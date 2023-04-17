import { Table, Model, Column, DataType, ForeignKey, BelongsTo, Default } from 'sequelize-typescript';
import { User } from './user.model';

export enum ManagerRequestStatus {
  notViewed = 'notViewed',
  viewed = 'viewed',
  accepted = 'accepted',
  canceled = 'canceled',
}

@Table
export class ManagerRequest extends Model<ManagerRequest> {
  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: DataType.TEXT })
  file: string;

  @Default(ManagerRequestStatus.notViewed)
  @Column(DataType.ENUM(...Object.values(ManagerRequestStatus)))
  status: ManagerRequestStatus;
}
