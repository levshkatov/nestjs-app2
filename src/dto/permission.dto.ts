import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { PermissionsNames } from '../models/permission.model';

export class PermissionDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: PermissionsNames;

  @ApiProperty()
  description: string;
}

export class PermissionsReqDto {
  @ApiProperty({
    example: [1],
    description: 'Массив id разрешений',
    type: [Number],
  })
  @Type(() => Number)
  @IsNumber({}, { each: true })
  permissions: number[];
}
