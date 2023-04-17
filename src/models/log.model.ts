import { AllowNull, Column, DataType, Default, Model, Table } from 'sequelize-typescript';

@Table
export class Log extends Model<Log> {
  @AllowNull
  @Column
  ipAddr: string;

  @AllowNull
  @Column
  method: string;

  @AllowNull
  @Column({ type: DataType.TEXT })
  url: string;

  @AllowNull
  @Column
  userId: number;

  @AllowNull
  @Column({ type: DataType.TEXT })
  username: string;

  @AllowNull
  @Column
  reqLength: number;

  @AllowNull
  @Column
  resLength: number;

  @AllowNull
  @Column
  resStatus: number;

  @AllowNull
  @Column({ type: DataType.TEXT })
  resStatusMessage: string;

  @AllowNull
  @Column
  resTime: number;

  @AllowNull
  @Column({ type: DataType.TEXT })
  reqType: string;

  @AllowNull
  @Column({ type: DataType.JSONB })
  reqBody: any;

  @AllowNull
  @Column({ type: DataType.TEXT })
  authToken: string;

  @AllowNull
  @Column({ type: DataType.ARRAY(DataType.TEXT) })
  errors: string[];

  @AllowNull
  @Column({ type: DataType.JSONB })
  serverError: any;

  @AllowNull
  @Default(null)
  @Column({ type: DataType.TEXT })
  appLog: string;
}
