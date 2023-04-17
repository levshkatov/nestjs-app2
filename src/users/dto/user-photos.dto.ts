import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Max } from 'class-validator';
import { PaginationReqDto } from '../../dto/pagination.dto';
import { PhotoDto, PhotoWithAuthorDto } from '../../dto/photo.dto';

export class UserPhotosReqDto extends PaginationReqDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'мин: 1, макс: 40; default: 10',
  })
  @Max(40)
  limit = 10;
}

export class UserPhotosDto {
  @ApiProperty()
  count: number;

  @ApiProperty({ type: [PhotoWithAuthorDto] })
  photos: PhotoWithAuthorDto[];
}

export class UserAlbumsReqDto extends PaginationReqDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'мин: 1, макс: 20; default: 10',
  })
  @Max(20)
  limit = 10;
}

class AlbumsDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  photo: PhotoDto;

  @ApiProperty()
  date: Date;
}

export class UserAlbumsDto {
  @ApiProperty()
  count: number;

  @ApiProperty({ type: [AlbumsDto] })
  albums: AlbumsDto[];
}
