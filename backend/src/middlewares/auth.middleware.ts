import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/decorators/decorator';
import { UnauthorizedException } from 'src/shared/exceptions/domain.exceptions';
import { verifyToken } from 'src/shared/auth/auth';
import { SESSIONS_REPOSITORY } from 'src/modules/auth/application/ports/session.port';
import type { ISessionsRepository } from 'src/modules/auth/application/ports/session.port';

export interface RequestUser {
  userId: string;
  role: 'user' | 'admin';
  sessionId: string;
}

declare module 'express' {
  interface Request {
    user?: RequestUser;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(SESSIONS_REPOSITORY) private readonly sessions: ISessionsRepository,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // Allow @Public() routes through
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException(
        'Autenticação necessária',
        'JwtAuthGuard',
      );
    }

    // 1. Verify JWT signature & shape
    const payload = verifyToken(token);
    if (!payload || payload.type !== 'user') {
      throw new UnauthorizedException(
        'Token inválido ou expirado',
        'JwtAuthGuard',
      );
    }

    // 2. Check session is still active in DB
    const session = await this.sessions.findByToken(token);
    if (!session || !session.isActive || session.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Sessão inválida ou revogada',
        'JwtAuthGuard',
      );
    }

    req.user = {
      userId: payload.userId,
      role: payload.role ?? 'user',
      sessionId: session.id,
    };

    return true;
  }

  private extractToken(req: Request): string | undefined {
    // Prefer httpOnly cookie, fall back to Bearer header
    const cookies = req.cookies as Record<string, string> | undefined;
    const cookie = cookies?.['auth_token'];
    if (cookie) return cookie;

    const auth = req.headers.authorization;
    if (typeof auth === 'string' && auth.startsWith('Bearer '))
      return auth.slice(7);

    return undefined;
  }
}
