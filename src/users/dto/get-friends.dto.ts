import { IsEnum, IsString, IsOptional, IsNumberString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileGender } from '../../models/profile.model';
import { MiniUserWithPhotoDto } from '../../dto/miniUser.dto';
import { PaginationReqDto } from '../../dto/pagination.dto';
import { Type } from 'class-transformer';

export class GetFriendsDto extends PaginationReqDto {
  @ApiPropertyOptional({
    description: 'id выбранного города',
  })
  @IsOptional()
  @IsNumberString(undefined, {
    message: 'Город указан неверно',
  })
  cityId: number;

  @ApiPropertyOptional({
    example: [],
    description: 'Массив id увлечений',
    type: [Number],
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  hobbiesIds: number | number[];

  @ApiPropertyOptional({
    enum: ProfileGender,
    example: 'male',
  })
  @IsOptional()
  @IsEnum(ProfileGender, {
    message: 'Пол указан не верно',
  })
  gender: ProfileGender;

  @ApiPropertyOptional({
    example: 16,
  })
  @IsOptional()
  @IsNumberString()
  ageFrom: number;

  @ApiPropertyOptional({
    example: 30,
  })
  @IsOptional()
  @IsNumberString()
  ageTo: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search: string;
}

export class GetFriendsResponse {
  @ApiProperty({
    type: [MiniUserWithPhotoDto],
  })
  friends: MiniUserWithPhotoDto[];

  @ApiPropertyOptional()
  friendsCount: number;

  @ApiPropertyOptional({
    type: [MiniUserWithPhotoDto],
  })
  users: MiniUserWithPhotoDto[];

  @ApiPropertyOptional()
  usersCount: number;
}
