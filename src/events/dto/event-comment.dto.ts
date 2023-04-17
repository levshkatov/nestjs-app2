import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { MiniUserWithPhotoDto } from '../../dto/miniUser.dto';

// getEventComments
export class EventCommentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  text: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: MiniUserWithPhotoDto })
  author: MiniUserWithPhotoDto;
}

// addEventComment
export class EventCommentReqDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  text: string;
}

// deleteEventComments
export class EventCommentsIdsReqDto {
  @ApiProperty({
    example: [1],
    description: 'Массив id комментариев',
    type: [Number],
  })
  @Type(() => Number)
  @IsNumber({}, { each: true })
  idArr: number[];
}
