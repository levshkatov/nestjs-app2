import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class EditEmailVerifyDto {
  @ApiProperty()
  @IsNotEmpty({
    message: 'Ссылка изменения электронной почты неверна',
  })
  edit_token: string;
}
