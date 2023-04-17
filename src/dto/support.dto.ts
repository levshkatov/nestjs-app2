import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportStatus } from '../models/support.model';
import { MiniUserDto } from './miniUser.dto';
import { PhotoDto } from './photo.dto';

export class SupportTitleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class SupportEventDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  photo: PhotoDto;
}

export class MiniSupportDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: SupportTitleDto;

  @ApiProperty({ enum: SupportStatus })
  status: SupportStatus;
}

export class SupportDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: SupportTitleDto;

  @ApiProperty()
  email: string;

  @ApiProperty()
  text: string;

  @ApiProperty({ enum: SupportStatus })
  status: SupportStatus;

  @ApiProperty({
    type: [String],
    example: ['file #1 src', 'file #2 src'],
  })
  files: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  user: MiniUserDto;

  @ApiPropertyOptional()
  targetUser: MiniUserDto;

  @ApiPropertyOptional()
  event: SupportEventDto;
}
