import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDate, ValidateNested } from 'class-validator';

class DayScheduleDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  time: Date;
}

export class EventScheduleDto {
  @ApiProperty()
  date: Date;

  @ApiProperty({ type: [DayScheduleDto] })
  daySchedule: DayScheduleDto[];
}

class DayScheduleReqDto {
  @ApiProperty({ example: 'Лекция' })
  name: string;

  @ApiProperty({ example: '2020-12-21T14:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  time: Date;
}

export class EventScheduleReqDto {
  @ApiProperty({ example: '2020-12-21T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({ type: [DayScheduleReqDto] })
  @IsArray()
  @ValidateNested()
  @ArrayMinSize(1)
  @Type(() => DayScheduleReqDto)
  daySchedule: DayScheduleReqDto[];
}
