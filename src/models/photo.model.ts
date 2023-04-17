import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsToMany,
  BelongsTo,
  DefaultScope,
  Scopes,
} from 'sequelize-typescript';
import { Event } from './event.model';
import { EventPhoto } from './eventPhoto.model';
import { Profile } from './profile.model';
import { User } from './user.model';

@DefaultScope(() => ({
  attributes: ['id', 'src', 'srcPreview', 'srcOriginal', 'blurHash', 'createdAt'],
}))
@Scopes(() => ({
  withAuthor: {
    attributes: ['id', 'src', 'srcPreview', 'srcOriginal', 'blurHash', 'createdAt'],
    include: [
      {
        model: User,
        attributes: ['id', 'userType'],
        include: [
          {
            model: Profile,
            attributes: ['name', 'surname'],
          },
        ],
      },
    ],
  },
}))
@Table
export class Photo extends Model<Photo> {
  @ForeignKey(() => User)
  @Column
  authorId: number;

  @BelongsTo(() => User)
  author: User;

  @Column({ type: DataType.TEXT })
  src: string;

  @Column({ type: DataType.TEXT })
  srcPreview: string;

  @Column({ type: DataType.TEXT })
  srcOriginal: string;

  @Column
  blurHash: string;

  @BelongsToMany(() => Event, () => EventPhoto)
  events: Event[];
}
