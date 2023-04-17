import { ApiProperty } from '@nestjs/swagger';

export class FilesUploadReqDto {
  @ApiProperty({
    type: 'file',
    isArray: true,
  })
  files: any;
}
