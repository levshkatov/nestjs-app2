import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SignFirebaseDto {
  @ApiProperty({
    example: 'firebaseToken',
  })
  @IsNotEmpty()
  firebaseIdToken: string;
}

export class SignVkDto {
  @ApiProperty()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsNotEmpty()
  vkId: string;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  surname: string;
}
