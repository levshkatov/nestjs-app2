import { Table, Column, Model, ForeignKey, DataType } from 'sequelize-typescript';
import { Event } from './event.model';

@Table
export class EventComment extends Model<EventComment> {
  @ForeignKey(() => Event)
  @Column
  eventId: number;

  @Column(DataType.TEXT)
  text: string;
}
