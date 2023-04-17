import { Controller, UseGuards, Body, Patch, Get, Param, ParseIntPipe, SetMetadata } from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../models/user.model';
import { SettingsService } from './settings.service';
import {
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  getSchemaPath,
  ApiConflictResponse,
} from '@nestjs/swagger';
import {
  EditEmailDto,
  EditPasswordDto,
  EditPhoneDto,
  EditProfileDto,
  EditSettingDto,
  EditSettingResponse,
} from './dto/edit.dto';
import { JwtAuthGuard } from '../auth/jwtAuth.guard';
import { PermissionsGuard } from '../auth/permission.guard';
import { ErrorDto, MessageDto } from '../dto/simple-response.dto';
import { ManagerDto, UserDto } from '../dto/user.dto';
import { PermissionDto, PermissionsReqDto } from '../dto/permission.dto';
import { SettingDto } from '../dto/setting.dto';
import { PermissionsNames } from '../models/permission.model';

@ApiTags('users/settings')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(), PermissionsGuard)
@Controller('users')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('/settings')
  @ApiOperation({
    summary: 'Получить настройки пользователя',
  })
  @ApiOkResponse({ type: SettingDto })
  getUserSettings(@GetUser() user: User) {
    return this.settingsService.getUserSettings(user);
  }

  @Patch('/profile')
  @ApiOperation({ summary: 'Редактировать профиль' })
  @ApiOkResponse({
    schema: {
      oneOf: [{ $ref: getSchemaPath(ManagerDto) }, { $ref: getSchemaPath(UserDto) }],
    },
    description: '<h3>UserDto OR ManagerDto model</h3>',
  })
  @ApiConflictResponse({ description: 'Пользователь уже существует', type: ErrorDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  editProfile(@Body() editDto: EditProfileDto, @GetUser() user: User) {
    return this.settingsService.editProfile(editDto, user);
  }

  @Patch('/phone')
  @ApiOperation({
    summary: 'Изменить номер телефона',
    description: 'Изменить телефон и если нет пароля установить его',
  })
  @ApiOkResponse({ type: MessageDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  editPhone(@Body() editPhoneDto: EditPhoneDto, @GetUser() user: User) {
    return this.settingsService.editPhone(editPhoneDto, user);
  }

  @Patch('/password')
  @ApiOperation({ summary: 'Изменить пароль' })
  @ApiOkResponse({ type: MessageDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  editPassword(@Body() editDto: EditPasswordDto, @GetUser() user: User) {
    return this.settingsService.editPassword(editDto, user);
  }

  @Patch('/email')
  @ApiOperation({ summary: 'Изменить email' })
  @ApiOkResponse({ type: MessageDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  editEmail(@Body() editDto: EditEmailDto, @GetUser() user: User) {
    return this.settingsService.editEmail(editDto, user);
  }

  @Patch('/setting')
  @ApiOperation({ summary: 'Изменение одной опции настроек' })
  @ApiOkResponse({ type: EditSettingResponse })
  @ApiBadRequestResponse({ type: ErrorDto })
  editUserSetting(@Body() editSettingDto: EditSettingDto, @GetUser() user: User) {
    return this.settingsService.editUserSetting(editSettingDto, user);
  }

  @Get('/permissions')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.permissionsGet])
  @ApiOperation({
    summary: 'Получение списка разрешений [admin]',
  })
  @ApiOkResponse({ type: [PermissionDto] })
  @ApiBadRequestResponse({ type: ErrorDto })
  getPermissions() {
    return this.settingsService.getPermissions();
  }

  @Get('/:id/permissions')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.permissionsGet])
  @ApiOperation({
    summary: 'Получение разрешений пользователя [admin]',
  })
  @ApiOkResponse({ type: [PermissionDto] })
  @ApiNotFoundResponse({ type: ErrorDto, description: 'Пользователь не найден' })
  @ApiBadRequestResponse({ type: ErrorDto })
  getUserPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.settingsService.getUserPermissions(id);
  }

  @Patch('/:id/permissions')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.permissionsEdit])
  @ApiOperation({
    summary: 'Изменение разрешений пользователя [admin]',
  })
  @ApiOkResponse({ type: MessageDto })
  @ApiNotFoundResponse({ type: ErrorDto, description: 'Пользователь не найден' })
  @ApiBadRequestResponse({ type: ErrorDto })
  editUserPermissions(@Param('id', ParseIntPipe) id: number, @Body() editDto: PermissionsReqDto) {
    return this.settingsService.editUserPermissions(id, editDto);
  }

  @Get('/permissions/init/:secret')
  initPermissions(@Param('secret') secret: string) {
    return this.settingsService.initPermissions(secret);
  }
}
