import { ApiProperty } from '@nestjs/swagger';

export class CityDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class CityWithLocationDto extends CityDto {
  @ApiProperty({ format: 'double' })
  longitude: number;

  @ApiProperty({ format: 'double' })
  latitude: number;
}
