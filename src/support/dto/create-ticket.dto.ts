import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FilesUploadReqDto } from '../../dto/files.dto';
import { SupportStatus } from '../../models/support.model';

export class CreateTicketDto extends FilesUploadReqDto {
  @ApiProperty({
    example: 'test@gmail.com',
  })
  @IsEmail(undefined, {
    message: 'Email введен неверно',
  })
  email: string;

  @ApiProperty({
    example: 1,
  })
  @IsNotEmpty({
    message: 'Тема запроса неверная',
  })
  titleId: number;

  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsNotEmpty({
    message: 'Событие выбрано неверно',
  })
  eventId: number;

  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsNotEmpty({
    message: 'Выбранный пользователь введен неверно',
  })
  targetUserId: number;

  @ApiProperty()
  @IsNotEmpty({
    message: 'Текст пуст',
  })
  text: string;

  @ApiPropertyOptional()
  @IsOptional()
  files: any;
}

export class EditSupportDto {
  @ApiProperty({ enum: SupportStatus })
  @IsEnum(SupportStatus)
  status: SupportStatus;
}
