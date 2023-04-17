import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { MiniUserWithPhotoDto } from '../../dto/miniUser.dto';

export enum EventMemberRole {
  creator = 'creator',
  friend = 'friend',
  member = 'member',
}

export enum EventMemberDtoState {
  joined = 'joined',
  pending = 'pending',
  blocked = 'blocked',
  all = 'all',
}

// getEventMembers
export class EventMemberDto extends MiniUserWithPhotoDto {
  @ApiProperty({ enum: EventMemberRole })
  role: EventMemberRole;
}

// getEventMembers
export class EventMemberReqDto {
  @ApiPropertyOptional({
    description: 'Тип участников, по умолчанию joined',
    enum: EventMemberDtoState,
  })
  @IsOptional()
  @IsEnum(EventMemberDtoState)
  state: EventMemberDtoState = EventMemberDtoState.joined;
}
