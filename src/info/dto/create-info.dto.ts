import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInfoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}
