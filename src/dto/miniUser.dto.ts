import { ApiProperty } from '@nestjs/swagger';
import { UserTypes } from '../models/user.model';
import { HobbieDto } from './hobbie.dto';
import { PhotoDto } from './photo.dto';

export class MiniUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  surname: string;

  @ApiProperty({ enum: UserTypes })
  userType: UserTypes;
}

export class MiniUserWithPhotoDto extends MiniUserDto {
  @ApiProperty({ type: () => PhotoDto })
  photo: PhotoDto;
}

export class MiniUserWithHobbiesDto extends MiniUserWithPhotoDto {
  @ApiProperty({ type: () => [HobbieDto] })
  hobbies: HobbieDto[];
}

export class MiniManagerDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: () => PhotoDto })
  photo: PhotoDto;
}
