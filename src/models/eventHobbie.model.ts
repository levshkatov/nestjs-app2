import { Table, ForeignKey, Column, Model } from 'sequelize-typescript';
import { Event } from './event.model';
import { Hobbie } from './hobbie.model';

@Table
export class EventHobbie extends Model<EventHobbie> {
  @ForeignKey(() => Event)
  @Column
  eventId: number;

  @ForeignKey(() => Hobbie)
  @Column
  hobbieId: number;
}
