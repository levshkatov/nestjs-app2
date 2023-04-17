import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Patch,
  SetMetadata,
  ParseIntPipe,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { InfoService } from './info.service';
import { CityDto } from '../dto/city.dto';
import { SearchFilterDto } from './dto/get-filter.dto';
import { CreateHobbieDto } from './dto/create-hobbie.dto';
import { EventType } from '../models/eventType.model';
import { JwtAuthGuard } from '../auth/jwtAuth.guard';
import { CreateEventTypeDto } from './dto/create-eventType.dto';
import { CreateInfoDto } from './dto/create-info.dto';
import { SupportTitleDto } from '../dto/support.dto';
import { PermissionsGuard } from '../auth/permission.guard';
import { ErrorDto } from '../dto/simple-response.dto';
import { HobbieDto, HobbieWithChildrenDto } from '../dto/hobbie.dto';
import { PermissionsNames } from '../models/permission.model';

@ApiTags('info')
@Controller('info')
export class InfoController {
  constructor(private infoService: InfoService) {}

  @Get('/cities')
  @ApiOperation({ summary: 'Получение городов, по умолчанию - первые 3. Поиск по названию. Сортировка по id' })
  @ApiOkResponse({ type: [CityDto] })
  @ApiBadRequestResponse({ type: ErrorDto })
  getCities(@Query() filterDto: SearchFilterDto) {
    return this.infoService.getCities(filterDto);
  }

  @Get('/hobbies')
  @ApiOperation({ summary: 'Получение увлечений. Поиск по названию. Сортировка по названию' })
  @ApiOkResponse({ type: [HobbieWithChildrenDto] })
  @ApiBadRequestResponse({ type: ErrorDto })
  getHobbies(@Query() filterDto: SearchFilterDto) {
    return this.infoService.getHobbies(filterDto);
  }

  @ApiBearerAuth()
  @Post('/hobbies')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.infoHobbieAdd])
  @UseGuards(new JwtAuthGuard(), PermissionsGuard)
  @ApiOperation({ summary: 'Добавление увлечения' })
  @ApiCreatedResponse({ type: HobbieDto, description: 'Увлечение создано' })
  @ApiBadRequestResponse({ type: ErrorDto })
  createHobbie(@Body() createDto: CreateHobbieDto) {
    return this.infoService.createHobbie(createDto);
  }

  @ApiBearerAuth()
  @Patch('/hobbies/:id')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.infoHobbieEdit])
  @UseGuards(new JwtAuthGuard(), PermissionsGuard)
  @ApiOperation({ summary: 'Редактирование увлечения' })
  @ApiOkResponse({ description: 'Увлечение изменено' })
  @ApiBadRequestResponse({ type: ErrorDto })
  editHobbie(@Param('id', ParseIntPipe) id: number, @Body() editDto: CreateHobbieDto) {
    return this.infoService.editHobbie(id, editDto);
  }

  @ApiBearerAuth()
  @Delete('/hobbies/:id')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.infoHobbieDelete])
  @UseGuards(new JwtAuthGuard(), PermissionsGuard)
  @ApiOperation({ summary: 'Удаление увлечения' })
  @ApiOkResponse({ description: 'Увлечение удалено' })
  @ApiBadRequestResponse({ type: ErrorDto })
  deleteHobbie(@Param('id', ParseIntPipe) id: number) {
    return this.infoService.delteHobbie(id);
  }

  @Get('/eventTypes')
  @ApiOperation({ summary: 'Получение типов событий. Поиск по названию. Сортировка по id' })
  @ApiOkResponse({ type: [EventType] })
  @ApiBadRequestResponse({ type: ErrorDto })
  getEventTypes(@Query() filterDto: SearchFilterDto) {
    return this.infoService.getEventTypes(filterDto);
  }

  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard())
  @Post('/eventTypes')
  @ApiOperation({ summary: 'Добавление типа события' })
  @ApiCreatedResponse({ type: EventType, description: 'Тип события создан' })
  @ApiBadRequestResponse({ type: ErrorDto })
  createEventType(@Body() createDto: CreateEventTypeDto) {
    return this.infoService.createEventType(createDto);
  }

  @Get('/support/titles')
  @ApiOperation({ summary: 'Получение тем поддержки' })
  @ApiOkResponse({ type: [SupportTitleDto] })
  @ApiBadRequestResponse({ type: ErrorDto })
  getSupportTitles() {
    return this.infoService.getSupportTitles();
  }

  @ApiBearerAuth()
  @Post('/support/titles')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.infoSupportTitleAdd])
  @UseGuards(new JwtAuthGuard(), PermissionsGuard)
  @ApiOperation({ summary: 'Добавление темы поддержки' })
  @ApiCreatedResponse({ type: SupportTitleDto, description: 'Тема поддержки создана' })
  @ApiBadRequestResponse({ type: ErrorDto })
  createSupportTitle(@Body() createDto: CreateInfoDto) {
    return this.infoService.createSupportTitle(createDto);
  }

  @ApiBearerAuth()
  @Patch('/support/titles/:id')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.infoSupportTitleEdit])
  @UseGuards(new JwtAuthGuard(), PermissionsGuard)
  @ApiOperation({ summary: 'Редактирование темы поддержки' })
  @ApiOkResponse({ type: SupportTitleDto, description: 'Тема изменена' })
  @ApiBadRequestResponse({ type: ErrorDto })
  editSupportTitle(@Param('id', ParseIntPipe) id: number, @Body() editDto: CreateHobbieDto) {
    return this.infoService.editSupportTitle(id, editDto);
  }

  @ApiBearerAuth()
  @Delete('/support/titles/:id')
  @SetMetadata('permissions', [PermissionsNames.admin, PermissionsNames.infoSupportTitleDelete])
  @UseGuards(new JwtAuthGuard(), PermissionsGuard)
  @ApiOperation({ summary: 'Удаление темы' })
  @ApiOkResponse({ type: SupportTitleDto, description: 'Тема удалена' })
  @ApiBadRequestResponse({ type: ErrorDto })
  deleteSupportTitle(@Param('id', ParseIntPipe) id: number) {
    return this.infoService.deleteSupportTitle(id);
  }
}
