import { Table, Model, Column, DataType } from 'sequelize-typescript';

@Table
export class EventType extends Model<EventType> {
  @Column
  name: string;

  @Column({ type: DataType.TEXT })
  description: string;
}
