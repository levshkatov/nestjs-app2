import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class EventDateDto {
  @ApiProperty()
  from: Date;

  @ApiProperty()
  to: Date;
}

export class EventDateReqDto {
  @ApiProperty({ example: '2020-12-21T14:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  from: Date;

  @ApiProperty({ example: '2020-12-21T15:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  to: Date;
}
