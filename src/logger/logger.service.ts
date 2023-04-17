import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Response } from 'express';
import { Op } from 'sequelize';
import { PaginationReqDto } from '../dto/pagination.dto';
import { Log } from '../models/log.model';
import { AppLogReqDto, LoggerReqDto } from './dto/logger.dto';

@Injectable()
export class LoggerService {
  constructor(
    @InjectModel(Log)
    private logModel: typeof Log,
  ) {}

  async getLogs({ id, ipAddr, method, url, userId, username, resStatus, reqType, offset, limit }: LoggerReqDto) {
    const filterCondition: {
      id?: any;
      ipAddr?: any;
      method?: any;
      url?: any;
      userId?: any;
      username?: any;
      resStatus?: any;
      reqType?: any;
      appLog?: any;
    } = {};

    filterCondition.appLog = null;

    if (id) {
      filterCondition.id = id;
    }

    if (ipAddr) {
      filterCondition.ipAddr = { [Op.iLike]: `%${ipAddr}%` };
    }

    if (method) {
      filterCondition.method = { [Op.iLike]: `%${method}%` };
    }

    if (url) {
      filterCondition.url = { [Op.iLike]: `%${url}%` };
    }

    if (userId) {
      filterCondition.userId = userId;
    }

    if (username) {
      filterCondition.username = { [Op.iLike]: `%${username}%` };
    }

    if (resStatus) {
      filterCondition.resStatus = resStatus;
    }

    if (reqType) {
      filterCondition.reqType = { [Op.iLike]: `%${reqType}%` };
    }

    return this.logModel.findAll({
      where: filterCondition,
      attributes: {
        exclude: ['appLog'],
      },
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });
  }

  async getLog(id: number) {
    return this.logModel.findByPk(id);
  }

  async getAppLogs({ limit, offset }: PaginationReqDto, res: Response) {
    const logs = await this.logModel.findAll({
      where: {
        appLog: {
          [Op.ne]: null,
        },
      },
      attributes: ['id', 'appLog', 'createdAt'],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });

    const logsJSON = logs.map((log) => {
      return log.appLog ? this.prettyLog(log, false) : log;
    });

    return res.send(
      `<pre style="width: 1850; white-space: pre-wrap;">${JSON.stringify(logsJSON, null, 2).replace(
        /\\n/g,
        '\n      ',
      )}</pre>`,
    );
  }

  async addAppLog(text: any) {
    await Log.create({
      appLog: JSON.stringify(text),
    });
    return { message: 'OK' };
  }

  async getLogPretty(id: number, res: Response) {
    const log = await this.logModel.findByPk(id);

    if (log.appLog) {
      const _log = this.prettyLog(log);
      return res.send(
        `<pre style="width: 1850; white-space: pre-wrap;">${JSON.stringify(_log, null, 2).replace(
          /\\n/g,
          '\n      ',
        )}</pre>`,
      );
    }

    const logJSON: any = log.toJSON();

    logJSON.reqBody = logJSON.reqBody ? JSON.parse(logJSON.reqBody) : null;
    return res.send(`<pre>${JSON.stringify(logJSON, null, 2)}</pre>`);
  }

  prettyLog(log, isDetailed = true) {
    let appLog: any = log.appLog;

    try {
      appLog = JSON.parse(appLog);
      if (!appLog.error) {
        appLog = JSON.parse(appLog);
        if (!appLog.error) {
          appLog = JSON.parse(appLog);
        }
      }
    } catch (e) {
      appLog = log.appLog;
    }

    return isDetailed
      ? {
          id: log.id,
          createdAt: log.createdAt,
          log: appLog,
        }
      : {
          id: log.id,
          createdAt: log.createdAt,
          error: appLog.error,
        };
  }
}
