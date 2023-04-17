import { ApiProperty } from '@nestjs/swagger';

export class SettingDto {
  @ApiProperty()
  pushInterestingEvents: boolean;

  @ApiProperty()
  pushRemindTreeDays: boolean;

  @ApiProperty()
  pushRemindOneDay: boolean;

  @ApiProperty()
  pushRemindOnFinish: boolean;

  @ApiProperty()
  pushRemindOnFriends: boolean;

  @ApiProperty()
  pushGroup: boolean;

  @ApiProperty()
  pushGroupSound: boolean;

  @ApiProperty()
  pushPrivateFriends: boolean;

  @ApiProperty()
  pushPrivateAll: boolean;

  @ApiProperty()
  pushPrivateSound: boolean;

  @ApiProperty()
  emailInterestingEvents: boolean;

  @ApiProperty()
  emailRemindTreeDays: boolean;

  @ApiProperty()
  emailRemindOneDay: boolean;

  @ApiProperty()
  emailRemindOnFinish: boolean;
}
