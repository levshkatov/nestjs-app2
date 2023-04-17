import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max } from 'class-validator';
import { PaginationReqDto } from '../../dto/pagination.dto';
import { PhotoWithAuthorDto } from '../../dto/photo.dto';

// getEventPhotos
export class EventPhotoPagedDto {
  @ApiProperty({ description: 'Общее число фотографий события' })
  count: number;

  @ApiProperty({ type: [PhotoWithAuthorDto] })
  photos: PhotoWithAuthorDto[];
}

// getEventPhotos
export class EventPhotoReqDto extends PaginationReqDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'мин: 1, макс: 40; default: 10',
  })
  @Max(40)
  limit = 10;
}

// addEventPhotos
export class EventPhotoIdsReqDto {
  @ApiProperty({
    example: [1],
    description: 'Массив id фотографий',
    type: [Number],
  })
  @Type(() => Number)
  @IsNumber({}, { each: true })
  idArr: number[];
}
