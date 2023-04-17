import { ApiProperty } from '@nestjs/swagger';

export class HobbieDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class HobbieWithChildrenDto extends HobbieDto {
  @ApiProperty({ type: [HobbieDto] })
  children: HobbieDto[];
}
