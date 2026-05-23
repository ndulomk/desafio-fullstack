import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from 'src/modules/users/application/services/user.service';
import {
  updateProfileSchema,
  updateRoleSchema,
  type UpdateProfileDto,
  type UpdateRoleDto,
  UserResponseDto,
  UserListResponseDto,
} from '../../../application/dtos/user.dto';
import { JwtAuthGuard } from 'src/middlewares/auth.middleware';
import { CurrentUser, Roles } from 'src/decorators/decorator';
import { ZodValidationPipe } from 'src/shared/zod/zod-validation-pipe';

@ApiTags('users')
@ApiCookieAuth('auth_token')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  // GET /api/v1/users/me
  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do utilizador autenticado' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  getMe(@CurrentUser() user: { userId: string; role: string }) {
    return this.svc.getProfile(user.userId, user.userId, user.role);
  }

  // PATCH /api/v1/users/me
  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateMe(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return this.svc.updateProfile(user.userId, dto);
  }

  // GET /api/v1/users  (admin only)
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Listar todos os utilizadores (admin)' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: UserListResponseDto })
  listAll(
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listAll({
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // PATCH /api/v1/users/:id/role  (admin only)
  @Patch(':id/role')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar role de utilizador (admin)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateRole(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRoleSchema)) dto: UpdateRoleDto,
  ) {
    return this.svc.updateRole(id, dto.role);
  }
}
