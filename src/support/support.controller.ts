import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  SetMetadata,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../auth/get-user.decorator';
import { OptionalAuthGuard, JwtAuthGuard } from '../auth/jwtAuth.guard';
import { PermissionsGuard } from '../auth/permission.guard';
import { ErrorDto, MessageDto } from '../dto/simple-response.dto';
import { SupportDto } from '../dto/support.dto';
import { PermissionsNames } from '../models/permission.model';
import { User } from '../models/user.model';
import { CreateTicketDto, EditSupportDto } from './dto/create-ticket.dto';
import { GetTicketsDto, GetTicketsResponse } from './dto/get-tickets.dto';
import { SupportService } from './support.service';

@ApiTags('support')
@ApiBearerAuth()
@Controller('support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Get('/')
  @UseGuards(new JwtAuthGuard(), PermissionsGuard)
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.supportGet])
  @ApiOperation({ summary: 'Список обращений [admin]' })
  @ApiOkResponse({ type: GetTicketsResponse })
  @ApiBadRequestResponse({ type: ErrorDto })
  getTickets(@Query() getDto: GetTicketsDto) {
    return this.supportService.getSupportTickets(getDto);
  }

  @Get('/:id')
  @UseGuards(new JwtAuthGuard(), PermissionsGuard)
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.supportGet])
  @ApiOperation({ summary: 'Просмотр обращения [admin]' })
  @ApiOkResponse({ type: SupportDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  getTicket(@Param('id') id: number) {
    return this.supportService.getSupportTicket(id);
  }

  @Post('/')
  @UseGuards(new OptionalAuthGuard())
  @ApiOperation({
    summary: 'Отправить обращение в службу поддержки',
    description: `Форматы: jpg, jpeg, png, gif.<br>Максимальный размер одной: <b>5Мб</b>.<br>Response: массив id фотографий`,
  })
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: 'Обращение успешно отправлено', type: MessageDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  createTicket(@Body() createDto: CreateTicketDto, @UploadedFiles() files, @GetUser() user: User) {
    return this.supportService.createSupportTicket(createDto, files, user);
  }

  @Patch('/:id')
  @UseGuards(new JwtAuthGuard(), PermissionsGuard)
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.supportEdit])
  @ApiOperation({ summary: 'Изменить статус обращения [admin]' })
  @ApiOkResponse({ type: MessageDto })
  @ApiNotFoundResponse({ type: ErrorDto, description: 'Обращение не найдено' })
  editSupport(@Param('id') id: number, @Body() editDto: EditSupportDto) {
    return this.supportService.editSupport(id, editDto);
  }
}
