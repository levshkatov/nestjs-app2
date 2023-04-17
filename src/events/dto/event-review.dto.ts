import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { MiniUserWithPhotoDto } from '../../dto/miniUser.dto';

// getEventRate
export class EventRateDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  rate: number;

  @ApiProperty()
  countReviews: number;
}

// getEventReviews
export class EventReviewDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  text: string;

  @ApiProperty()
  rate: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: MiniUserWithPhotoDto })
  author: MiniUserWithPhotoDto;
}

// addEventReview
export class EventReviewReqDto {
  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsNotEmpty()
  rate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text: string;
}
