import { Table, Column, Model, ForeignKey, DataType, DefaultScope } from 'sequelize-typescript';
import { Event } from './event.model';

@DefaultScope(() => ({
  attributes: {
    exclude: ['eventId'],
  },
}))
@Table
export class EventSchedule extends Model<EventSchedule> {
  @ForeignKey(() => Event)
  @Column
  eventId: number;

  @Column({ type: DataType.DATE })
  date: Date;

  @Column({ type: DataType.JSONB })
  daySchedule: { name: string; time: Date };
}
