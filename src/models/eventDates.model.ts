import { Table, Column, Model, DataType, DefaultScope, ForeignKey } from 'sequelize-typescript';
import { Event } from './event.model';

@DefaultScope(() => ({
  attributes: {
    exclude: ['eventId'],
  },
}))
@Table
export class EventDate extends Model<EventDate> {
  @ForeignKey(() => Event)
  @Column
  eventId: number;

  @Column({ type: DataType.DATE })
  from: Date;

  @Column({ type: DataType.DATE })
  to: Date;
}
