import { Controller, UseGuards, Get, Query, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../models/user.model';
import { JwtAuthGuard, OptionalAuthGuard } from '../auth/jwtAuth.guard';
import { EventActionReqDto } from './dto/event-action.dto';
import { EventCommentDto, EventCommentReqDto, EventCommentsIdsReqDto } from './dto/event-comment.dto';
import {
  EventPagedDto,
  EventPartialDto,
  EventDto,
  EventsFeedReqDto,
  EventsReqDto,
  EventCreateReqDto,
  EventEditReqDto,
  EventsAllReqDto,
} from './dto/event.dto';
import { ErrorDto, MessageDto } from '../dto/simple-response.dto';
import { EventPhotoIdsReqDto, EventPhotoPagedDto, EventPhotoReqDto } from './dto/event-photo.dto';
import { EventMemberDto, EventMemberReqDto } from './dto/event-member.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { EventRateDto, EventReviewDto, EventReviewReqDto } from './dto/event-review.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Получение событий по id пользователя',
    description: 'Поиск по названию.<br>Сортировка по дате создания.<br>Пагинация (дефолт - 20 на странице, сдвиг 0)',
  })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiOkResponse({ type: EventPagedDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  getEvents(@I18n() i18n: I18nContext, @Query() eventsReqDto: EventsReqDto, @GetUser() user: User) {
    return this.eventsService.getEvents(i18n, eventsReqDto, user);
  }

  @Post('/')
  @ApiOperation({
    summary: 'Добавление события',
    description: 'Поля "isFree, regulations, site, schedule, registrationLink" доступны только для афиш',
  })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiCreatedResponse({ type: EventDto, description: 'Событие добавлено' })
  @ApiBadRequestResponse({ type: ErrorDto })
  createEvent(@I18n() i18n: I18nContext, @Body() eventReqDto: EventCreateReqDto, @GetUser() user: User) {
    return this.eventsService.createEvent(i18n, eventReqDto, user);
  }

  @Get('/feed')
  @ApiOperation({
    summary: 'Получение ленты событий по фильтру',
    description: 'Поиск по названию.<br>Сортировка по дате создания.<br>Пагинация (дефолт - 20 на странице, сдвиг 0)',
  })
  @ApiBearerAuth()
  @UseGuards(new OptionalAuthGuard())
  @ApiOkResponse({ type: EventPagedDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  getEventsFeed(@I18n() i18n: I18nContext, @Query() eventsFeedReqDto: EventsFeedReqDto, @GetUser() user: User) {
    return this.eventsService.getEventsFeed(i18n, eventsFeedReqDto, user);
  }

  @Get('/all')
  @ApiOperation({
    summary: 'Получение событий по фильтру [admin]',
    description: 'Поиск по названию.<br>Сортировка по дате создания.<br>Пагинация (дефолт - 20 на странице, сдвиг 0)',
  })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiOkResponse({ type: EventPagedDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  getAllEvents(@I18n() i18n: I18nContext, @Query() eventsAllReqDto: EventsAllReqDto, @GetUser() user: User) {
    return this.eventsService.getAllEvents(i18n, eventsAllReqDto, user);
  }

  @Get('/:eventId')
  @ApiOperation({
    summary: 'Получение события по id',
    description: 'Без авторизации - <tt>participationState: unavailable</tt>',
  })
  @ApiBearerAuth()
  @UseGuards(new OptionalAuthGuard())
  @ApiOkResponse({ type: EventDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  getEventById(@I18n() i18n: I18nContext, @Param('eventId') eventId: number, @GetUser() user: User) {
    return this.eventsService.getEventById(i18n, eventId, user);
  }

  @Patch('/:eventId')
  @ApiOperation({
    summary: 'Редактирование события',
    description: 'Поля "isFree, regulations, site, schedule, registrationLink" доступны только для афиш',
  })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiCreatedResponse({ type: EventDto, description: 'Событие изменено' })
  @ApiBadRequestResponse({ type: ErrorDto })
  editEvent(
    @I18n() i18n: I18nContext,
    @Param('eventId') eventId: number,
    @Body() eventReqDto: EventEditReqDto,
    @GetUser() user: User,
  ) {
    return this.eventsService.editEvent(i18n, eventId, eventReqDto, user);
  }

  @Delete('/:eventId')
  @ApiOperation({ summary: 'Удаление события по id' })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiOkResponse({ type: MessageDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  deleteEvent(@I18n() i18n: I18nContext, @Param('eventId') eventId: number, @GetUser() user: User) {
    return this.eventsService.deleteEvent(i18n, eventId, user);
  }

  @Patch('/:eventId/action')
  @ApiOperation({
    summary: 'Выполнение действия с событием',
    description: `<b>enter</b> - Вступить в открытое событие или отправить заявку в закрытое. Доп поля не требуются<br><br>
      <b>leave</b> - Покинуть событие. Доп поля не требуются<br><br>
      <b>cancel</b> - Отменить событие. Доп поля не требуются<br><br>
      <b>block</b> - Заблокировать пользователя в событии, он не сможет вступить в него в дальнейшем. Требуется <i>userId</i><br><br>
      <b>unblock</b> - Разблокировать пользователя в событии. Его статус (joined, pending) сохранится. Требуется <i>userId</i><br><br>
      <b>accept</b> - Принять заявку в закрытое событие. Требуется <i>userId</i><br><br>
      <b>decline</b> - Отклонить заявку в закрытое событие. Требуется <i>userId</i><br><br>
      <b>changeOwner</b> - Сменить автора события. Требуется <i>userId</i> нового владельца<br><br>
      <b>publish</b> - Опубликовать событие. Доп поля не требуются<br><br>
      <b>unpublish</b> - Снять событие с публикации. Можно указать <i>unpublishReason</i>`,
  })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiOkResponse({ type: MessageDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  actionEvent(
    @I18n() i18n: I18nContext,
    @Param('eventId') eventId: number,
    @Query() eventActionReqDto: EventActionReqDto,
    @GetUser() user: User,
  ) {
    return this.eventsService.actionEvent(i18n, eventId, eventActionReqDto, user);
  }

  @Get('/:eventId/members')
  @ApiOperation({
    summary: 'Получение участников события',
  })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiOkResponse({ type: [EventMemberDto] })
  @ApiBadRequestResponse({ type: ErrorDto })
  getEventMembers(
    @I18n() i18n: I18nContext,
    @Param('eventId') eventId: number,
    @Query() eventMemberReqDto: EventMemberReqDto,
    @GetUser() user: User,
  ) {
    return this.eventsService.getEventMembers(i18n, eventId, eventMemberReqDto, user);
  }

  @Get('/:eventId/photos')
  @ApiOperation({
    summary: 'Получение фотографий события',
    description: 'Пагинация (дефолт - 20 на странице, сдвиг 0)',
  })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiOkResponse({ type: EventPhotoPagedDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  getEventPhotos(
    @I18n() i18n: I18nContext,
    @Param('eventId') eventId: number,
    @Query() eventPhotoReqDto: EventPhotoReqDto,
    @GetUser() user: User,
  ) {
    return this.eventsService.getEventPhotos(i18n, eventId, eventPhotoReqDto, user);
  }

  @Post('/:eventId/photos')
  @ApiOperation({ summary: 'Добавление фотографий события' })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiOkResponse({ type: MessageDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  addEventPhotos(
    @I18n() i18n: I18nContext,
    @Param('eventId') eventId: number,
    @Body() eventPhotoIdsReqDto: EventPhotoIdsReqDto,
    @GetUser() user: User,
  ) {
    return this.eventsService.addEventPhotos(i18n, eventId, eventPhotoIdsReqDto, user);
  }

  @Get('/:eventId/comments')
  @ApiOperation({ summary: 'Получение комментариев события' })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiOkResponse({ type: [EventCommentDto] })
  @ApiBadRequestResponse({ type: ErrorDto })
  getEventComments(@I18n() i18n: I18nContext, @Param('eventId') eventId: number, @GetUser() user: User) {
    return this.eventsService.getEventComments(i18n, eventId, user);
  }

  @Post('/:eventId/comments')
  @ApiOperation({ summary: 'Добавление комментария к событию' })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiOkResponse({ type: EventCommentDto, description: 'Комментарий добавлен' })
  @ApiBadRequestResponse({ type: ErrorDto })
  addEventComment(
    @I18n() i18n: I18nContext,
    @Param('eventId') eventId: number,
    @Body() eventCommentReqDto: EventCommentReqDto,
    @GetUser() user: User,
  ) {
    return this.eventsService.addEventComment(i18n, eventId, eventCommentReqDto, user);
  }

  @Post('/:eventId/comments/delete')
  @ApiOperation({ summary: 'Удаление комментария события' })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiOkResponse({ type: MessageDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  deleteEventComments(
    @I18n() i18n: I18nContext,
    @Param('eventId') eventId: number,
    @Body() eventCommentsIdsReqDto: EventCommentsIdsReqDto,
    @GetUser() user: User,
  ) {
    return this.eventsService.deleteEventComments(i18n, eventId, eventCommentsIdsReqDto, user);
  }

  @Get('/:eventId/rate')
  @ApiOperation({ summary: 'Получение рейтинга события' })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiOkResponse({ type: EventRateDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  getEventRate(@I18n() i18n: I18nContext, @Param('eventId') eventId: number, @GetUser() user: User) {
    return this.eventsService.getEventRate(i18n, eventId, user);
  }

  @Get('/:eventId/reviews')
  @ApiOperation({ summary: 'Получение отзывов к событию' })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiOkResponse({ type: [EventReviewDto] })
  @ApiBadRequestResponse({ type: ErrorDto })
  getEventReviews(@I18n() i18n: I18nContext, @Param('eventId') eventId: number, @GetUser() user: User) {
    return this.eventsService.getEventReviews(i18n, eventId, user);
  }

  @Post('/:eventId/reviews')
  @ApiOperation({ summary: 'Добавление отзыва к событию' })
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @ApiOkResponse({ type: MessageDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  addEventReview(
    @I18n() i18n: I18nContext,
    @Param('eventId') eventId: number,
    @Body() eventReviewReqDto: EventReviewReqDto,
    @GetUser() user: User,
  ) {
    return this.eventsService.addEventReview(i18n, eventId, eventReviewReqDto, user);
  }
}
