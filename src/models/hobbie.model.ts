import { BelongsTo, Column, DefaultScope, HasMany, Model, Table } from 'sequelize-typescript';

@DefaultScope(() => ({
  attributes: {
    exclude: ['createdAt', 'updatedAt'],
  },
}))
@Table
export class Hobbie extends Model<Hobbie> {
  @Column
  name: string;

  @BelongsTo(() => Hobbie, { as: 'parent', foreignKey: 'parentId' })
  parent: Hobbie;

  @HasMany(() => Hobbie, { as: 'children', foreignKey: 'parentId' })
  children: Hobbie[];
}
