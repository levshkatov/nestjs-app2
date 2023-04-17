import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, Matches } from 'class-validator';
import { PermissionsReqDto } from '../../dto/permission.dto';

export class CreateAdminDto extends PermissionsReqDto {
  @ApiProperty({
    description: 'Любой идентификатор для входа в админ панель',
    example: 'adminlogin',
  })
  @IsEmail(
    {},
    {
      message: 'Email введен неверно',
    },
  )
  email: string;

  @ApiProperty({
    example: 'StrongPass123',
  })
  @Matches(/(?![.\n])(?=.*[A-Z])(?=.*[a-z]).{8,20}$/, {
    message: 'Пароль должен состоять минимум из 8 символов и одной заглавной буквы',
  })
  password: string;
}

export class SendManagerRequestDto {
  @ApiProperty({
    example: '+7902555100',
  })
  @IsNotEmpty({
    message: 'Телефон не должно быть пустым',
  })
  phone: string;

  @ApiProperty()
  @IsNotEmpty({
    message: 'Название не должно быть пустым',
  })
  name: string;

  @ApiProperty()
  @IsNotEmpty({
    message: 'Контактное лицо не должно быть пустым',
  })
  contactName: string;

  @ApiProperty({
    example: 'ИНН',
  })
  @IsNotEmpty({
    message: 'ИНН не должно быть пустым',
  })
  ITN: string;

  @ApiProperty({
    example: 'ОГРН',
  })
  @IsNotEmpty({
    message: 'ОГРН не должно быть пустым',
  })
  PSRN: string;

  @ApiPropertyOptional({
    example: 'Адрес',
  })
  @IsOptional()
  legalAddress: string;

  @ApiPropertyOptional({
    example: 'Юр. лицо',
  })
  @IsOptional()
  legalEntity: string;

  @ApiPropertyOptional({
    example: 'site.com',
  })
  @IsOptional()
  site: string;

  @ApiProperty({
    type: 'file',
  })
  file: any;

  @ApiProperty({
    example: 1,
  })
  @IsNumber(undefined, {
    message: 'Город указан неверно',
  })
  @Type(() => Number)
  cityId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber(undefined, {
    message: 'Фотография указана неверно',
  })
  @Type(() => Number)
  photoId: number;

  @ApiPropertyOptional({
    example: [1],
    type: [Number],
  })
  @IsOptional()
  @IsNumber({}, { each: true, message: 'Увлечения указаны неверно' })
  @Transform((x) => {
    if (typeof x === 'string') {
      return x.split(',').map((e) => parseInt(e));
    }
    return x.map((e) => parseInt(e));
  })
  hobbiesIds: number | number[];
}
