import { Controller, UseGuards, Body, Post, Get, Query, SetMetadata, BadRequestException } from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../models/user.model';
import { ApiTags, ApiOkResponse, ApiBadRequestResponse, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GetFriendsDto, GetFriendsResponse } from './dto/get-friends.dto';
import { JwtAuthGuard } from '../auth/jwtAuth.guard';
import { GetBlockedResponse } from './dto/get-blocked.dto';
import { AddRemoveDto, AddRemoveFriendResponse } from './dto/add-remove.dto';
import { GetSubscriptionsDto, GetSubscriptionsResponse } from './dto/get-subscriptions.dto';
import { RelationsService } from './relations.service';
import { PermissionsGuard } from '../auth/permission.guard';
import { ErrorDto, MessageDto } from '../dto/simple-response.dto';
import { PermissionsNames } from '../models/permission.model';

@ApiTags('users/relations')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(), PermissionsGuard)
@Controller('users/relations')
export class RelationsController {
  constructor(private relationsService: RelationsService) {}

  @Get('/friends')
  @SetMetadata('permissions', [PermissionsNames.client])
  @ApiOperation({
    summary: 'Список всех своих друзей | при фильтре/поиску => список друзей и глобальный список',
  })
  @ApiOkResponse({ type: GetFriendsResponse })
  @ApiBadRequestResponse({ type: ErrorDto })
  getFriends(@Query() getUsersDto: GetFriendsDto, @GetUser() user: User) {
    return this.relationsService.getFriends(getUsersDto, user);
  }

  @Get('/blocked')
  @SetMetadata('permissions', [PermissionsNames.client, PermissionsNames.manager])
  @ApiOperation({ summary: 'Черный список' })
  @ApiOkResponse({ type: GetBlockedResponse })
  @ApiBadRequestResponse({ type: ErrorDto })
  getBlocked(@GetUser() user: User) {
    return this.relationsService.getBlocked(user);
  }

  @Get('/subscriptions')
  @ApiOperation({
    summary: 'Подписки',
    description: 'userId default id текущего пользователя',
  })
  @ApiOperation({ description: 'Получение подписок пользователя, userId по умолчанию текущий пользователь' })
  @ApiOkResponse({ type: GetSubscriptionsResponse })
  @ApiBadRequestResponse({ type: ErrorDto })
  getSubscriptions(@Query() getDto: GetSubscriptionsDto, @GetUser() user: User) {
    return this.relationsService.getSubscriptions(getDto, user);
  }

  @Post('/friends')
  @ApiOperation({ summary: 'Добавить в друзья / удалить из друзей' })
  @SetMetadata('permissions', [PermissionsNames.client])
  @ApiOkResponse({ type: AddRemoveFriendResponse })
  @ApiBadRequestResponse({ type: ErrorDto })
  addOrRemoveFriend(@Body() { targetId, action }: AddRemoveDto, @GetUser() user: User) {
    if (targetId === user.id) {
      throw new BadRequestException('Нельзя добавить пользователя в друзья');
    }

    if (action === true) {
      return this.relationsService.addFriend(targetId, user);
    }

    return this.relationsService.removeFriend(targetId, user);
  }

  @Post('/blocked')
  @SetMetadata('permissions', [PermissionsNames.client, PermissionsNames.manager])
  @ApiOperation({ summary: 'Добавить в черный список / удалить с ЧС' })
  @ApiOkResponse({ type: MessageDto })
  @ApiBadRequestResponse({ description: 'Нельзя заблокировать пользователя', type: ErrorDto })
  addOrRemoveBlock(@Body() { targetId, action }: AddRemoveDto, @GetUser() user: User) {
    if (targetId === user.id) {
      throw new BadRequestException('Нельзя заблокировать пользователя');
    }

    if (action === true) {
      return this.relationsService.addBlock(targetId, user);
    }

    return this.relationsService.removeBlock(targetId, user);
  }

  @Post('/subscriptions')
  @SetMetadata('permissions', [PermissionsNames.client])
  @ApiOperation({ summary: 'Подписаться / отписаться от организатора' })
  @ApiOkResponse({ type: MessageDto })
  @ApiBadRequestResponse({ description: 'Нельзя подписаться на пользователя', type: ErrorDto })
  addOrRemoveSubscription(@Body() { targetId, action }: AddRemoveDto, @GetUser() user: User) {
    if (targetId === user.id) {
      throw new BadRequestException('Нельзя подписаться на пользователя');
    }

    if (action === true) {
      return this.relationsService.addSubscription(targetId, user);
    }
    return this.relationsService.removeSubscription(targetId, user);
  }
}
