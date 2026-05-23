import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from 'src/modules/auth/application/services/auth.service';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  type RegisterDto,
  type LoginDto,
  type RefreshDto,
  AuthResponseDto,
} from 'src/modules/auth/application/dtos/auth.dto';
import { JwtAuthGuard } from 'src/middlewares/auth.middleware';
import { CurrentUser, Public } from 'src/decorators/decorator';
import { setAuthCookie, clearAuthCookie } from 'src/shared/auth/cookies';
import { ZodValidationPipe } from 'src/shared/zod/zod-validation-pipe';
import type { RequestUser } from 'src/middlewares/auth.middleware';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  // POST /api/v1/auth/register
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registar novo utilizador' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.svc.register(dto);
    setAuthCookie(res, req, result.accessToken);
    return { refreshToken: result.refreshToken, user: result.user };
  }

  // POST /api/v1/auth/login
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sessão' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ua = req.headers['user-agent'];
    const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? req.ip;
    const result = await this.svc.login(dto, ua, ip);
    setAuthCookie(res, req, result.accessToken);
    return { refreshToken: result.refreshToken, user: result.user };
  }

  // POST /api/v1/auth/refresh
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refresh(
    @Body(new ZodValidationPipe(refreshSchema)) dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.svc.refresh(dto.refreshToken);
    setAuthCookie(res, req, result.accessToken);
    return { refreshToken: result.refreshToken, user: result.user };
  }

  // POST /api/v1/auth/token — devolve token em JSON para uso com Bearer
  @Post('token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter token (Bearer) — use após login para testar no Swagger',
  })
  @ApiResponse({
    status: 200,
    schema: { example: { accessToken: 'jwt-string' } },
  })
  token(@Req() req: Request) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.['auth_token'];
    return { accessToken: token ?? null };
  }

  // POST /api/v1/auth/logout  (protected)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('auth_token')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminar sessão' })
  async logout(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const authHeader = req.headers.authorization;
    const bearerToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : undefined;
    const token = cookies?.['auth_token'] ?? bearerToken;
    clearAuthCookie(res, req);
    if (token) await this.svc.logout(token);

    return { message: 'Sessão terminada' };
  }
}
