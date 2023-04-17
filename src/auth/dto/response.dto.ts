import { ApiProperty } from '@nestjs/swagger';
import { CityDto } from '../../dto/city.dto';
import { UserTypes } from '../../models/user.model';

class UserAuthResponse {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: UserTypes })
  userType: UserTypes;
}

export class ResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: UserAuthResponse;
}

class UserAuthSocialResponse {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: UserTypes })
  userType: UserTypes;

  @ApiProperty()
  name: string;

  @ApiProperty()
  surname: string;

  @ApiProperty()
  gender: string;

  @ApiProperty()
  birth: string;

  @ApiProperty()
  city: CityDto;
}

export class ResponseSocialDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: UserAuthSocialResponse;

  @ApiProperty()
  needMoreInfo: boolean;
}
