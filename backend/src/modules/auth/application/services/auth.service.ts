import { Injectable, Inject } from '@nestjs/common';
import * as argon2 from 'argon2';
import { RegisterDto, LoginDto, AuthResponseDto } from '../dtos/auth.dto';
import {
  type IUsersRepository,
  USERS_REPOSITORY,
} from 'src/modules/users/application/ports/user.port';
import {
  type ISessionsRepository,
  SESSIONS_REPOSITORY,
} from 'src/modules/auth/application/ports/session.port';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from 'src/shared/exceptions/domain.exceptions';
import { signToken, verifyToken } from '../../../../shared/auth/jwt';
import { getEncryption } from '../../../../shared/crypto/encryption.service';
import { withTransaction } from 'src/db/transaction';

const COMPONENT = 'AuthService';
const ACCESS_TTL = 15 * 60;
const REFRESH_TTL = 7 * 24 * 3600;

@Injectable()
export class AuthService {
  private readonly enc = getEncryption();

  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: IUsersRepository,
    @Inject(SESSIONS_REPOSITORY) private readonly sessions: ISessionsRepository,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const emailHash = this.enc.hash(dto.email);

    const existing = await this.users.findByEmailHash(emailHash);
    if (existing) throw new ConflictException('Email já registado', COMPONENT);

    const passwordHash = await argon2.hash(dto.password);

    const { user, accessToken, refreshToken } = await withTransaction(
      async (tx) => {
        const user = await this.users.create(
          { name: dto.name, email: dto.email, emailHash, passwordHash },
          tx,
        );

        const { accessToken, refreshToken } = this.buildTokens(user.id);

        await this.sessions.create(
          {
            userId: user.id,
            token: accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + ACCESS_TTL * 1000),
          },
          tx,
        );

        return { user, accessToken, refreshToken };
      },
    );

    return { accessToken, refreshToken, user };
  }

  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const emailHash = this.enc.hash(dto.email);
    const found = await this.users.findByEmailHash(emailHash);

    if (!found)
      throw new UnauthorizedException('Credenciais inválidas', COMPONENT);
    if (!found.isActive)
      throw new ForbiddenException('Conta desactivada', COMPONENT);

    const valid = await argon2.verify(found.passwordHash, dto.password);
    if (!valid)
      throw new UnauthorizedException('Credenciais inválidas', COMPONENT);

    const { accessToken, refreshToken } = this.buildTokens(found.id);

    await this.sessions.create({
      userId: found.id,
      token: accessToken,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + ACCESS_TTL * 1000),
    });

    return { accessToken, refreshToken, user: found };
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const payload = verifyToken(refreshToken);
    if (!payload || payload.type !== 'user_refresh') {
      throw new UnauthorizedException(
        'Refresh token inválido ou expirado',
        COMPONENT,
      );
    }

    const session = await this.sessions.findByRefreshToken(refreshToken);
    if (!session || !session.isActive) {
      throw new UnauthorizedException('Sessão inválida ou revogada', COMPONENT);
    }

    await this.sessions.revoke(session.id);

    const user = await this.users.findById(payload.userId);
    if (!user)
      throw new UnauthorizedException('Utilizador não encontrado', COMPONENT);

    const tokens = this.buildTokens(payload.userId);

    await this.sessions.create({
      userId: payload.userId,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + ACCESS_TTL * 1000),
    });

    return { ...tokens, user };
  }

  async logout(token: string): Promise<void> {
    const session = await this.sessions.findByToken(token);
    if (session) await this.sessions.revoke(session.id);
  }

  private buildTokens(userId: string) {
    return {
      accessToken: signToken(
        { userId, role: 'user', type: 'user' },
        ACCESS_TTL,
      ),
      refreshToken: signToken(
        { userId, role: 'user', type: 'user_refresh' },
        REFRESH_TTL,
      ),
    };
  }
}
