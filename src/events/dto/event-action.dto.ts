import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum EventAction {
  enter = 'enter',
  leave = 'leave',
  cancel = 'cancel',
  block = 'block',
  unblock = 'unblock',
  accept = 'accept',
  decline = 'decline',
  changeOwner = 'changeOwner',
  publish = 'publish',
  unpublish = 'unpublish',
}

// actionEvent
export class EventActionReqDto {
  @ApiProperty({
    description: 'Тип действия с событием',
    enum: EventAction,
  })
  @IsEnum(EventAction)
  action: EventAction;

  @ApiPropertyOptional()
  @IsOptional()
  userId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unpublishReason: string;
}
