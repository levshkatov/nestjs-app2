import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FcmTokenDto {
  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string | string[];
}
