import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express/multer/interceptors/files.interceptor';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwtAuth.guard';
import { ErrorDto, MessageDto } from '../dto/simple-response.dto';
import { User } from '../models/user.model';
import { FilesUploadReqDto } from '../dto/files.dto';
import { MediaService } from './media.service';
import { PhotoWithAuthorDto } from '../dto/photo.dto';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard())
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Добавление фотографий',
    description: 'Форматы: jpg, jpeg, png, gif.<br>Максимальный размер одной: 5Мб.<br>Response: массив id фотографий',
  })
  @ApiCreatedResponse({ type: [PhotoWithAuthorDto] })
  @ApiBadRequestResponse({ type: ErrorDto })
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Список фотографий',
    type: FilesUploadReqDto,
  })
  uploadFile(@UploadedFiles() files, @GetUser() user: User) {
    return this.mediaService.uploadFile(files, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удаление фотографии',
  })
  @ApiOkResponse({ type: MessageDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  deletePhoto(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.mediaService.deletePhoto(id, user);
  }
}
