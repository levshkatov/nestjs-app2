import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, IsDate, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationReqDto } from '../../dto/pagination.dto';
import { SupportDto } from '../../dto/support.dto';
import { SupportStatus, SupportType } from '../../models/support.model';

export class GetTicketsDto extends PaginationReqDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  titleId: number;

  @ApiPropertyOptional({ example: '2020-09-21T14:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom: Date;

  @ApiPropertyOptional({ example: '2020-11-21T14:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo: Date;

  @ApiPropertyOptional({
    enum: SupportStatus,
  })
  @IsOptional()
  @IsEnum(SupportStatus)
  status: SupportStatus;

  @ApiPropertyOptional({
    enum: SupportType,
  })
  @IsOptional()
  @IsEnum(SupportType)
  type: SupportType;

  @Max(20)
  limit: 20;
}

export class GetTicketsResponse {
  @ApiProperty()
  count: number;

  @ApiProperty({ type: [SupportDto] })
  rows: SupportDto[];
}
