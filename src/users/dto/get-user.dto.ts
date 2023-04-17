import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhotoWithAuthorDto } from '../../dto/photo.dto';
import { ManagerDto, UserDto } from '../../dto/user.dto';

export class GetUserResponse extends UserDto {
  @ApiProperty({
    example: 'notFriend | friend | pending | blocked | youBlocked',
  })
  friendshipStatus: string;

  @ApiProperty()
  friendsCount: number;

  @ApiProperty()
  subscriptionsCount: number;

  @ApiProperty()
  organizedCount: number;

  @ApiProperty()
  participatedInCount: number;

  @ApiProperty()
  photosCount: number;

  @ApiPropertyOptional()
  notHavePassword: boolean;

  @ApiProperty({ type: [PhotoWithAuthorDto] })
  photos: PhotoWithAuthorDto[];
}

export class GetManagerResponse extends ManagerDto {
  @ApiProperty({
    example: 'notSubscribed | subscribed | youBlocked | blocked',
  })
  subscriptionStatus: string;

  @ApiProperty()
  organized: number;

  @ApiProperty()
  subscribers: number;

  @ApiProperty()
  friends: number;

  @ApiProperty()
  photosCount: number;

  @ApiProperty({ type: [PhotoWithAuthorDto] })
  photos: PhotoWithAuthorDto[];
}
