import { Table, ForeignKey, Column, Model } from 'sequelize-typescript';
import { User } from './user.model';
import { Hobbie } from './hobbie.model';

@Table
export class UserHobbie extends Model<UserHobbie> {
  @ForeignKey(() => User)
  @Column
  userId: number;

  @ForeignKey(() => Hobbie)
  @Column
  hobbieId: number;
}
