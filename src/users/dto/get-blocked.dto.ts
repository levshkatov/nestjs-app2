import { ApiProperty } from '@nestjs/swagger';
import { MiniUserWithPhotoDto } from '../../dto/miniUser.dto';

export class GetBlockedResponse {
  @ApiProperty()
  count: number;

  @ApiProperty({
    type: [MiniUserWithPhotoDto],
  })
  blocked: MiniUserWithPhotoDto[];
}
