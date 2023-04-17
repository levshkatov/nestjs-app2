import { ApiProperty } from '@nestjs/swagger';
import { MiniUserDto } from './miniUser.dto';

export class PhotoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  src: string;

  @ApiProperty()
  srcPreview: string;

  @ApiProperty()
  srcOriginal: string;

  @ApiProperty()
  blurHash: string;

  @ApiProperty()
  createdAt: Date;
}

export class PhotoWithAuthorDto extends PhotoDto {
  @ApiProperty({ type: () => MiniUserDto })
  author: MiniUserDto;
}
