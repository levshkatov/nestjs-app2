import { IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateInfoDto } from './create-info.dto';

export class CreateHobbieDto extends CreateInfoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  parentId: number;
}
