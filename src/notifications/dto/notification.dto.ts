import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MiniUserWithPhotoDto } from '../../dto/miniUser.dto';
import { PhotoDto } from '../../dto/photo.dto';
import { NotificationActionText, NotificationType } from '../../models/notification.model';

export class NotifycationEventDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  startFrom: Date;

  @ApiProperty()
  photo: PhotoDto;
}

export class NotificationDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  text: string;

  @ApiProperty({
    enum: NotificationType,
  })
  type: NotificationType;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  event: NotifycationEventDto;

  @ApiPropertyOptional()
  targetUser: MiniUserWithPhotoDto;

  @ApiPropertyOptional({
    enum: NotificationActionText,
  })
  actionText: NotificationActionText;
}

export class GetNotificationsResponse {
  @ApiProperty()
  count: number;

  @ApiProperty({ type: [NotificationDto] })
  notifications: NotificationDto[];
}
