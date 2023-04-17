import { IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MiniUserWithPhotoDto } from '../../dto/miniUser.dto';
import { PaginationReqDto } from '../../dto/pagination.dto';

export class GetSubscriptionsDto extends PaginationReqDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId: number;
}

export class GetSubscriptionsResponse {
  @ApiProperty()
  count: number;

  @ApiProperty({
    type: [MiniUserWithPhotoDto],
  })
  subscriptions: MiniUserWithPhotoDto[];
}
