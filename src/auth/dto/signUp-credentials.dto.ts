import { Matches, IsNotEmpty, IsNumber, IsEnum, IsDate, MaxDate, IsPhoneNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProfileGender } from '../../models/profile.model';
import { Type } from 'class-transformer';

export class SignUpCredentialsDto {
  @ApiProperty({
    example: '+79999999999',
  })
  @IsPhoneNumber(null, {
    message: 'Номер телефона введен неверно',
  })
  phone: string;

  @ApiProperty({
    example: 'StrongPass123',
  })
  @Matches(/^(?=.*[0-9])(?=.*[A-ZА-Я])(?=.*[a-zа-я])(?=\S+$).{8,}$/, {
    message: 'Пароль должен состоять минимум из 8 символов и одной заглавной буквы',
  })
  password: string;

  @ApiProperty({
    example: 'StrongPass123',
  })
  confirmPassword: string;

  @ApiProperty({
    example: 'John',
  })
  @IsNotEmpty({
    message: 'Имя не должно быть пустым',
  })
  name: string;

  @ApiProperty({
    example: 'Hoty',
  })
  @IsNotEmpty({
    message: 'Фамилия не должно быть пустым',
  })
  surname: string;

  @ApiProperty({
    enum: ProfileGender,
    example: 'male',
  })
  @IsEnum(ProfileGender, {
    message: 'Укажите свой пол',
  })
  gender: ProfileGender;

  @ApiProperty({ example: '2020-09-21T14:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @MaxDate(new Date(), {
    message: 'Дата рождения введена не верно',
  })
  birth: Date;

  @ApiProperty({
    example: 1,
    description: 'id выбранного города',
  })
  @IsNumber(undefined, {
    message: 'Город указан неверно',
  })
  cityId: number;

  @ApiProperty({
    example: [1, 2],
    description: 'Массив id увлечений',
    type: [Number],
  })
  @IsNumber(undefined, { each: true, message: 'Увлечения указаны неверно' })
  @Type(() => Number)
  hobbiesIds: number | number[];

  @ApiProperty({
    example: 'firebaseToken',
    description: `Токен полученный после верификации телефона -> firebase.auth().currentUser.getIdToken`,
  })
  @IsOptional()
  firebaseIdToken: string;
}
