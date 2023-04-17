import {
  Table,
  AllowNull,
  Model,
  Column,
  BelongsTo,
  ForeignKey,
  PrimaryKey,
  DataType,
  DefaultScope,
  Scopes,
} from 'sequelize-typescript';
import { City } from './city.model';
import { Photo } from './photo.model';
import { User } from './user.model';

export enum ProfileGender {
  male = 'male',
  female = 'female',
}

@DefaultScope(() => ({
  attributes: {
    exclude: [
      'userId',
      'cityId',
      'photoId',
      'createdAt',
      'updatedAt',
      'contactName',
      'ITN',
      'PSRN',
      'legalAddress',
      'legalEntity',
      'site',
    ],
  },
}))
@Scopes(() => ({
  simple: {
    attributes: ['name', 'surname', 'photoId'],
    include: [
      {
        model: Photo,
        as: 'photo',
      },
    ],
  },
  manager: {
    attributes: ['name', 'description', 'contactName', 'site'],
  },
  managerFull: {
    attributes: ['name', 'description', 'contactName', 'site', 'ITN', 'PSRN', 'legalAddress', 'legalEntity'],
  },
}))
@Table
export class Profile extends Model<Profile> {
  @PrimaryKey
  @ForeignKey(() => User)
  @Column
  userId: number;

  @Column
  name: string;

  @Column
  surname: string;

  @Column(DataType.ENUM(...Object.values(ProfileGender)))
  gender: ProfileGender;

  @Column({ type: DataType.DATEONLY })
  birth: Date;

  @AllowNull
  @Column({ type: DataType.TEXT })
  description: string;

  @ForeignKey(() => City)
  @Column
  cityId: number;

  @BelongsTo(() => City)
  city: City;

  @AllowNull
  @ForeignKey(() => Photo)
  @Column
  photoId: number;

  @BelongsTo(() => Photo)
  photo: Photo;

  @Column
  school: string;

  @Column
  university: string;

  /* Manager fields */

  @AllowNull
  @Column
  contactName: string;

  @AllowNull
  @Column
  ITN: string; // ИНН

  @AllowNull
  @Column
  PSRN: string; // ОГРН

  @AllowNull
  @Column
  legalAddress: string;

  @AllowNull
  @Column
  legalEntity: string;

  @AllowNull
  @Column
  site: string;

  toJSON() {
    const profile: any = super.toJSON();
    return profile;
  }
}
