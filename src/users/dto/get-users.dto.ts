import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsNumberString, IsOptional, IsString, Min } from 'class-validator';
import { MiniUserWithHobbiesDto } from '../../dto/miniUser.dto';
import { PaginationReqDto } from '../../dto/pagination.dto';
import { AdminDto, ManagerDto } from '../../dto/user.dto';
import { ManagerRequestStatus } from '../../models/managerRequest';
import { ProfileGender } from '../../models/profile.model';
import { UserTypes } from '../../models/user.model';

export class GetUsersDto extends PaginationReqDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @Transform((x) => (x == 'true' ? true : false))
  isBlocked: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform((x) => (x == 'true' ? true : false))
  isDeleted: boolean;

  @ApiPropertyOptional({
    enum: UserTypes,
  })
  @IsOptional()
  @IsEnum(UserTypes)
  userType: UserTypes;

  @ApiPropertyOptional({
    example: 16,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ageFrom: number;

  @ApiPropertyOptional({
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ageTo: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search: string;
}

export class GetUsersResponse {
  @ApiProperty()
  count: number;

  @ApiProperty({
    type: [MiniUserWithHobbiesDto],
  })
  users: MiniUserWithHobbiesDto[];
}

/* 
	Managers
*/

export class GetManagerRequestsDto extends PaginationReqDto {
  @ApiPropertyOptional({ enum: ManagerRequestStatus })
  @IsOptional()
  @IsEnum(ManagerRequestStatus)
  status: ManagerRequestStatus;

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

  @ApiPropertyOptional({ example: '2020-09-21T14:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom: Date;

  @ApiPropertyOptional({ example: '2020-11-21T14:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo: Date;
}

export class ManagerRequestDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  file: string;

  @ApiProperty({ enum: ManagerRequestStatus })
  status: ManagerRequestStatus;

  @ApiProperty()
  user: ManagerDto;
}

export class GetManagerRequestsResponse {
  @ApiProperty()
  count: number;

  @ApiProperty({ type: [ManagerRequestDto] })
  requests: ManagerRequestDto[];
}

/* 
  Admins
*/

export class GetAdminsResponse {
  @ApiProperty()
  count: number;

  @ApiProperty({
    type: [AdminDto],
  })
  users: AdminDto[];
}
