import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateInfoDto } from './create-info.dto';

export class CreateEventTypeDto extends CreateInfoDto {
  @ApiPropertyOptional()
  @IsOptional()
  description: string;
}
