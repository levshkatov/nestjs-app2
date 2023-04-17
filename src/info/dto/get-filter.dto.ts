import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search: string;
}
