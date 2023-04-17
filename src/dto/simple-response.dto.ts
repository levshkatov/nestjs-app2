import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty()
  message: string;
}

export class ErrorDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    example: ['Текст ошибки'],
    type: [String],
  })
  errors: string[];
}
