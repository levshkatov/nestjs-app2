import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber } from 'class-validator';
import { MessageDto } from '../../dto/simple-response.dto';
import { FriendshipStatus } from '../../models/userFriend.model';

export class AddRemoveDto {
  @ApiProperty({
    example: 1,
  })
  @IsNumber()
  targetId: number;

  @ApiProperty({
    description: 'true - добавить, false - удалить',
  })
  @IsBoolean()
  action: boolean;
}

export class AddRemoveFriendResponse extends MessageDto {
  @ApiProperty({
    example: 'notFriend | friend | pending | blocked | youBlocked',
  })
  friendshipStatus: FriendshipStatus;
}
