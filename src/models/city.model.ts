import { Table, Model, Column, DataType } from 'sequelize-typescript';

@Table({
  updatedAt: false,
  createdAt: false,
})
export class City extends Model<City> {
  @Column
  name: string;
}
