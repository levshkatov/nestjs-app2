import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard, OptionalAuthGuard } from '../auth/jwtAuth.guard';
import { PaginationReqDto } from '../dto/pagination.dto';
import { ErrorDto } from '../dto/simple-response.dto';
import { User } from '../models/user.model';
import { GetNotificationsResponse } from './dto/notification.dto';
import { FcmTokenDto } from './dto/token.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('/')
  @UseGuards(new JwtAuthGuard())
  @ApiOperation({ summary: 'Список уведомлений' })
  @ApiOkResponse({ type: GetNotificationsResponse })
  @ApiBadRequestResponse({ type: ErrorDto })
  getNotifications(@Query() getDto: PaginationReqDto, @GetUser() user: User) {
    return this.notificationsService.getNotifications(getDto, user);
  }

  @Post('/token')
  @UseGuards(new JwtAuthGuard())
  @ApiOperation({ summary: 'Добавить токен уведомлений' })
  @ApiBadRequestResponse({ type: ErrorDto })
  addFcmToken(@Body() fcmTokenDto: FcmTokenDto, @GetUser() user: User) {
    return this.notificationsService.addToken(fcmTokenDto, user.id);
  }

  @Delete('/token')
  @UseGuards(new OptionalAuthGuard())
  @ApiOperation({ summary: 'Удалить токен уведомлений' })
  @ApiBadRequestResponse({ type: ErrorDto })
  removeToken(@Body() fcmTokenDto: FcmTokenDto, @GetUser() user: User) {
    return this.notificationsService.removeToken(fcmTokenDto, user?.id);
  }
}
