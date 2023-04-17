import { ApiProperty } from '@nestjs/swagger';
import { IsLongitude, IsLatitude } from 'class-validator';

export class Location {
  @IsLatitude()
  @ApiProperty({ format: 'double' })
  latitude: number;

  @IsLongitude()
  @ApiProperty({ format: 'double' })
  longitude: number;
}
