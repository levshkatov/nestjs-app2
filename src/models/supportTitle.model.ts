import { Table, Model, Column, DefaultScope } from 'sequelize-typescript';

@DefaultScope(() => ({
  attributes: {
    exclude: ['createdAt', 'updatedAt'],
  },
}))
@Table
export class SupportTitle extends Model<SupportTitle> {
  @Column
  name: string;
}
