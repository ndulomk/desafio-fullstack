import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from 'src/decorators/decorator';
import { ForbiddenException } from 'src/shared/exceptions/domain.exceptions';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!requiredRoles?.length) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const user = req.user as { role: string } | undefined;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Acesso não autorizado', 'RolesGuard');
    }

    return true;
  }
}
