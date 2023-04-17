import {
  Controller,
  UseGuards,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseInterceptors,
  Body,
  SetMetadata,
  Query,
  Patch,
  UploadedFile,
} from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../models/user.model';
import { ManagersService } from './managers.service';
import {
  ApiTags,
  ApiOkResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiConsumes,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { GetManagerResponse } from './dto/get-user.dto';
import { JwtAuthGuard } from '../auth/jwtAuth.guard';
import { PermissionsGuard } from '../auth/permission.guard';
import { ErrorDto, MessageDto } from '../dto/simple-response.dto';
import { SendManagerRequestDto } from './dto/create-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetManagerRequestsDto, GetManagerRequestsResponse } from './dto/get-users.dto';
import { EditManagerRequestDto } from './dto/edit.dto';
import { PermissionsNames } from '../models/permission.model';

@ApiTags('users/managers')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(), PermissionsGuard)
@Controller('users/managers')
export class ManagersController {
  constructor(private managersService: ManagersService) {}

  @Get('/requests')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.managerRequestGet])
  @ApiOperation({ summary: 'Список заявок на организаторов [admin]' })
  @ApiOkResponse({ type: GetManagerRequestsResponse })
  getManagerRequests(@Query() getDto: GetManagerRequestsDto) {
    return this.managersService.getManagerRequests(getDto);
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Просмотр организатора',
  })
  @ApiOkResponse({ type: GetManagerResponse })
  @ApiNotFoundResponse({ type: ErrorDto, description: 'Организатор не найден; Организатор заблокирован' })
  getManagerById(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.managersService.getManagerById(id, user);
  }

  @Post('/requests')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Заявка на подтверждение организатора',
    description: 'Форматы: pdf, doc, docx, pptx, txt, jpg, jpeg, png, gif.<br>Максимальный размер одной: <b>5Мб</b>.',
  })
  @ApiOkResponse({ type: MessageDto, description: 'Заявка отправлена' })
  @ApiForbiddenResponse({ type: ErrorDto, description: 'Вы не можете подать заявку' })
  @ApiConflictResponse({ type: ErrorDto, description: 'Пользователь с этим телефоном уже существует' })
  @ApiBadRequestResponse({ type: ErrorDto, description: 'Заявка обрабатывается' })
  sendManagerRequest(@Body() createDto: SendManagerRequestDto, @UploadedFile() file, @GetUser() user: User) {
    return this.managersService.sendManagerRequest(createDto, file, user);
  }

  @Patch('/requests/:id')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.managerRequestEdit])
  @ApiOperation({ summary: 'Изменить статус заявки [admin]' })
  @ApiOkResponse({ type: MessageDto })
  @ApiNotFoundResponse({ type: ErrorDto, description: 'Заявка не найдена' })
  editManagerRequest(@Param('id') id: number, @Body() editDto: EditManagerRequestDto) {
    return this.managersService.editManagerRequest(id, editDto);
  }
}
