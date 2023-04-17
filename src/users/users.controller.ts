import {
  Controller,
  UseGuards,
  Body,
  Post,
  Get,
  Param,
  ParseIntPipe,
  Query,
  SetMetadata,
  Delete,
} from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../models/user.model';
import { UsersService } from './users.service';
import {
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { GetUserResponse } from './dto/get-user.dto';
import { GetAdminsResponse, GetUsersDto, GetUsersResponse } from './dto/get-users.dto';
import { JwtAuthGuard } from '../auth/jwtAuth.guard';
import { PermissionsGuard } from '../auth/permission.guard';
import { CreateAdminDto } from './dto/create-user.dto';
import { ErrorDto, MessageDto } from '../dto/simple-response.dto';
import { AdminDto } from '../dto/user.dto';
import { UserAlbumsDto, UserAlbumsReqDto, UserPhotosDto, UserPhotosReqDto } from './dto/user-photos.dto';
import { AddRemoveDto } from './dto/add-remove.dto';
import { PermissionsNames } from '../models/permission.model';
import { PaginationReqDto } from '../dto/pagination.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(), PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.userGet])
  @ApiOperation({ summary: 'Список пользователей [admin]' })
  @ApiOkResponse({ type: GetUsersResponse })
  @ApiBadRequestResponse({ type: ErrorDto })
  getUsers(@Query() getDto: GetUsersDto) {
    return this.usersService.getUsers(getDto);
  }

  @Get('/admins')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.adminGet])
  @ApiOperation({ summary: 'Список админов [admin]' })
  @ApiOkResponse({ type: GetAdminsResponse })
  @ApiBadRequestResponse({ type: ErrorDto })
  getAdmins(@Query() getDto: PaginationReqDto) {
    return this.usersService.getAdmins(getDto);
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Просмотр своего или чужого профиля',
    description: `Возвращенные данные могут меняться в зависимости является ли это 
			ваш / чужой профиль, или вас добавили в черный список`,
  })
  @ApiOkResponse({ type: GetUserResponse })
  @ApiNotFoundResponse({ type: ErrorDto, description: 'Пользователь не найден; Пользователь заблокирован' })
  getUserById(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.usersService.getUserById(id, user);
  }

  @Get('/:id/photos')
  @ApiOperation({
    summary: 'Список фоток пользователя',
  })
  @ApiOkResponse({ type: UserPhotosDto })
  @ApiNotFoundResponse({ type: ErrorDto })
  getUserPhotos(@Param('id', ParseIntPipe) id: number, @Query() getDto: UserPhotosReqDto, @GetUser() user: User) {
    return this.usersService.getUserPhotos(id, getDto, user);
  }

  @Get('/:id/photos/albums')
  @ApiOperation({
    summary: 'Список фотоальбомов событий пользователя',
  })
  @ApiOkResponse({ type: UserAlbumsDto })
  @ApiNotFoundResponse({ type: ErrorDto })
  getUserAlbums(@Param('id', ParseIntPipe) id: number, @Query() getDto: UserAlbumsReqDto, @GetUser() user: User) {
    return this.usersService.getUserAlbums(id, getDto, user);
  }

  @Post('/admins')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.userAdd])
  @ApiOperation({
    summary: 'Создание нового пользователя с указанными разрешениями [admin]',
  })
  @ApiCreatedResponse({ type: AdminDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  @ApiConflictResponse({ description: 'Пользователь уже существует', type: ErrorDto })
  createAdmin(@Body() createDto: CreateAdminDto) {
    return this.usersService.createAdmin(createDto);
  }

  @Post('/blocked')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.userBlockUnblock])
  @ApiOperation({
    summary: 'Заблокировать или разблокировать [admin]',
  })
  @ApiOkResponse({ type: MessageDto })
  @ApiNotFoundResponse({ type: ErrorDto, description: 'Пользователь не найден' })
  @ApiBadRequestResponse({ type: ErrorDto })
  addOrRemoveBlock(@Body() blockDto: AddRemoveDto, @GetUser() user: User) {
    return this.usersService.addOrRemoveBlock(blockDto, user);
  }

  @Delete('/')
  @ApiOperation({
    summary: 'Удалить свой аккаунт (soft delete)',
  })
  @ApiOkResponse({ type: MessageDto })
  deleteUser(@GetUser() user: User) {
    return this.usersService.deleteUser(user);
  }

  @Post('/restore/:id')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.userRestore])
  @ApiOperation({
    summary: 'Восстановить аккаунт',
  })
  @ApiOkResponse({ type: MessageDto })
  restoreUser(@Param('id') id: number) {
    return this.usersService.restoreUser(id);
  }

  @Delete('/:id')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.userDelete])
  @ApiOperation({
    summary: 'Удалить пользователя [admin] (hard delete, all data)',
  })
  @ApiOkResponse({ type: MessageDto })
  @ApiNotFoundResponse({ type: ErrorDto, description: 'Пользователь не найден' })
  deleteUserData(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUserData(id);
  }
}
