import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxDate,
} from 'class-validator';
import { ManagerRequestStatus } from '../../models/managerRequest';
import { ProfileGender } from '../../models/profile.model';
import { UserSettingNames } from '../../models/setting.model';

export class EditProfileDto {
  @ApiPropertyOptional({ example: '2020-09-21T14:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MaxDate(new Date(), {
    message: 'Дата рождения введена не верно',
  })
  birth: Date;

  @ApiPropertyOptional({
    example: 1,
    description: 'id выбранного города',
  })
  @IsOptional()
  @IsNumber(undefined, {
    message: 'Город указан неверно',
  })
  cityId: number;

  @ApiPropertyOptional({
    example: [1, 2],
    description: 'Массив id увлечений',
    type: [Number],
  })
  @IsOptional()
  @IsNumber(undefined, { each: true, message: 'Увлечения указаны неверно' })
  @Type(() => Number)
  hobbiesIds: number | number[];

  @ApiPropertyOptional()
  @IsOptional()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  school: string;

  @ApiPropertyOptional()
  @IsOptional()
  university: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber(undefined, {
    message: 'Фотография указана неверно',
  })
  photoId: number;

  @ApiPropertyOptional()
  @IsOptional()
  site: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({
    message: 'Имя не должно быть пустым',
  })
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty({
    message: 'Фамилия не должно быть пустым',
  })
  surname: string;

  @ApiProperty({
    enum: ProfileGender,
  })
  @IsOptional()
  @IsEnum(ProfileGender, {
    message: 'Укажите свой пол',
  })
  gender: ProfileGender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail(undefined, {
    message: 'Email введен неверно',
  })
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({
    message: 'Телефон не должно быть пустым',
  })
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({
    message: 'Контактное лицо не должно быть пустым',
  })
  contactName: string;
}

export class EditPhoneDto {
  @ApiProperty({
    example: 'StrongPass123',
    description: 'Если нет пароля, пароль станет этим значением',
  })
  @Matches(/^(?=.*[0-9])(?=.*[A-ZА-Я])(?=.*[a-zа-я])(?=\S+$).{8,}$/, {
    message: 'Пароль должен состоять минимум из 8 символов и одной заглавной буквы',
  })
  password: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  firebaseIdToken: string;
}

export class EditPasswordDto {
  @ApiPropertyOptional({
    example: 'StrongPass123',
    description: 'Если нет пароля, это поле не обязательно',
  })
  @IsOptional()
  @Matches(/^(?=.*[0-9])(?=.*[A-ZА-Я])(?=.*[a-zа-я])(?=\S+$).{8,}$/, {
    message: 'Пароль должен состоять минимум из 8 символов и одной заглавной буквы',
  })
  password: string;

  @ApiProperty({
    example: 'NewPassword',
  })
  @Matches(/^(?=.*[0-9])(?=.*[A-ZА-Я])(?=.*[a-zа-я])(?=\S+$).{8,}$/, {
    message: 'Пароль должен состоять минимум из 8 символов и одной заглавной буквы',
  })
  newPassword: string;

  @ApiProperty({
    example: 'NewPassword',
  })
  @Matches(/^(?=.*[0-9])(?=.*[A-ZА-Я])(?=.*[a-zа-я])(?=\S+$).{8,}$/, {
    message: 'Пароль должен состоять минимум из 8 символов и одной заглавной буквы',
  })
  confirmPassword: string;
}

export class EditEmailDto {
  @ApiProperty({
    example: 'test@gmail.com',
  })
  @IsEmail(undefined, {
    message: 'Email введен неверно',
  })
  email: string;
}

export class EditSettingDto {
  @ApiProperty({
    enum: UserSettingNames,
    example: 'pushRemindOnFriends',
  })
  @IsEnum(UserSettingNames, {
    message: 'Неверная опция настроек',
  })
  setting: UserSettingNames;

  @ApiProperty()
  @IsBoolean({
    message: 'Неверное значение настроек',
  })
  value: boolean;
}

export class EditSettingResponse {
  @ApiProperty()
  setting: boolean;
}

export class EditManagerRequestDto {
  @ApiProperty({ enum: ManagerRequestStatus })
  @IsEnum(ManagerRequestStatus)
  status: ManagerRequestStatus;
}
