import { ApiProperty } from '@nestjs/swagger';

export class EventTypeDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;
}
