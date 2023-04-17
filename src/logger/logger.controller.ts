import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PaginationReqDto } from '../dto/pagination.dto';
import { AppLogReqDto, LoggerReqDto } from './dto/logger.dto';
import { LoggerService } from './logger.service';

@Controller('logs')
export class LoggerController {
  constructor(private loggerService: LoggerService) {}

  @Get('/json')
  getLogs(@Query() loggerReqDto: LoggerReqDto) {
    return this.loggerService.getLogs(loggerReqDto);
  }

  @Get('/json/:id')
  getLog(@Param('id') id: number) {
    return this.loggerService.getLog(id);
  }

  @Get('/app')
  getAppLogs(@Query() paginationReqDto: PaginationReqDto, @Res() res: Response) {
    return this.loggerService.getAppLogs(paginationReqDto, res);
  }

  @Post('/app')
  addAppLog(@Body() appLogReqDto: any) {
    return this.loggerService.addAppLog(appLogReqDto);
  }

  @Get('/:id')
  getLogPretty(@Param('id') id: number, @Res() res: Response) {
    return this.loggerService.getLogPretty(id, res);
  }
}
