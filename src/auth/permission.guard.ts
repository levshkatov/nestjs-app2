import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../models/user.model';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!permissions) return true;

    const error = this.reflector.get<string>('permissionsError', context.getHandler()) || 'У вас нет необходимых прав';
    const user: User = context.switchToHttp().getRequest().user;
    const isCan = user.hasPermissions(permissions);

    if (isCan) {
      return true;
    } else {
      throw new ForbiddenException({
        statusCode: 403,
        errors: [error],
      });
    }
  }
}
