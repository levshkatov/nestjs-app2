import { Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInCredentialsDto {
  @ApiProperty({
    example: '+79025551007',
  })
  @IsNotEmpty({
    message: 'Телефон или email введен неверно',
  })
  phoneOrEmail: string;

  @ApiProperty({
    example: 'StrongPass123',
  })
  @Matches(/^(?=.*[0-9])(?=.*[A-ZА-Я])(?=.*[a-zа-я])(?=\S+$).{8,}$/, {
    message: 'Пароль должен состоять минимум из 8 символов и одной заглавной буквы',
  })
  password: string;
}
