import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class CrossService {
  constructor(
    @Inject('CHAT_ONE_SERVICE') private readonly clientOne: ClientProxy,
    @Inject('CHAT_ALL_SERVICE') private readonly clientAll: ClientProxy,
  ) {}

  async create(eventId: number, userId: number) {
    this.clientOne.emit({ cmd: 'chat.createByEvent' }, { eventId, userId });
  }
  async add(eventId: number, userId: number) {
    this.clientOne.emit({ cmd: 'chat.addEventMember' }, { eventId, userId });
  }
  async kick(eventId: number, userId: number) {
    this.clientOne.emit({ cmd: 'chat.kickEventMember' }, { eventId, userId });
  }
}
