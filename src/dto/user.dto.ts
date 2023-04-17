import { ApiProperty } from '@nestjs/swagger';
import { ProfileGender } from '../models/profile.model';
import { UserTypes } from '../models/user.model';
import { CityDto } from './city.dto';
import { HobbieDto } from './hobbie.dto';
import { PermissionDto } from './permission.dto';
import { PhotoDto } from './photo.dto';

export class UserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  isBlocked: boolean;

  @ApiProperty()
  deletedAt: Date;

  @ApiProperty({ enum: UserTypes })
  userType: UserTypes;

  @ApiProperty({ type: [HobbieDto] })
  hobbies: HobbieDto[];

  @ApiProperty()
  name: string;

  @ApiProperty()
  surname: string;

  @ApiProperty({ enum: ProfileGender })
  gender: ProfileGender;

  @ApiProperty()
  birth: Date;

  @ApiProperty()
  description: string;

  @ApiProperty()
  school: string;

  @ApiProperty()
  university: string;

  @ApiProperty()
  city: CityDto;

  @ApiProperty()
  photo: PhotoDto;
}

export class AdminDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  isBlocked: boolean;

  @ApiProperty({ enum: UserTypes })
  userType: UserTypes;

  @ApiProperty({ type: [PermissionDto] })
  permissions: PermissionDto[];
}

export class ManagerDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  isBlocked: boolean;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [HobbieDto] })
  hobbies: HobbieDto[];

  @ApiProperty()
  description: string;

  @ApiProperty()
  city: CityDto;

  @ApiProperty()
  photo: PhotoDto;

  @ApiProperty()
  contactName: string;

  @ApiProperty()
  site: string;

  @ApiProperty()
  ITN: string;

  @ApiProperty()
  PSR: string;

  @ApiProperty()
  legalAddres: string;

  @ApiProperty()
  legalEntity: string;

  @ApiProperty()
  isAccepted: boolean;
}
