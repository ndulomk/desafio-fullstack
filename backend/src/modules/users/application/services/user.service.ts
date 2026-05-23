import { Injectable, Inject } from '@nestjs/common';
import {
  type IUsersRepository,
  USERS_REPOSITORY,
  FindAllFilters,
} from '../ports/user.port';
import { UpdateProfileDto, UserResponseDto } from '../dtos/user.dto';
import {
  NotFoundException,
  ForbiddenException,
} from 'src/shared/exceptions/domain.exceptions';
import {
  type ListResponse,
  normalizePagination,
  buildListResponse,
} from 'src/shared/pagination';

const COMPONENT = 'UsersService';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
  ) {}

  // ── getProfile ─────────────────────────────────────────────────────────────
  async getProfile(
    requesterId: string,
    targetId: string,
    requesterRole: string,
  ): Promise<UserResponseDto> {
    if (requesterId !== targetId && requesterRole !== 'admin') {
      throw new ForbiddenException('Acesso não autorizado', COMPONENT);
    }

    const user = await this.repo.findById(targetId);
    if (!user)
      throw new NotFoundException('Utilizador não encontrado', COMPONENT);
    return user;
  }

  // ── updateProfile ──────────────────────────────────────────────────────────
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.repo.findById(userId);
    if (!user)
      throw new NotFoundException('Utilizador não encontrado', COMPONENT);
    return this.repo.update(userId, dto);
  }

  // ── listAll (admin) ────────────────────────────────────────────────────────
  async listAll(
    filters?: FindAllFilters,
  ): Promise<ListResponse<UserResponseDto>> {
    const { page, pageSize, offset } = normalizePagination({
      page: filters?.page,
      pageSize: filters?.limit,
    });
    const { data, total } = await this.repo.findAll({
      ...filters,
      page,
      limit: pageSize,
      offset,
    });
    return buildListResponse(data, total, page, pageSize);
  }

  // ── updateRole (admin) ─────────────────────────────────────────────────────
  async updateRole(
    userId: string,
    role: 'user' | 'admin',
  ): Promise<UserResponseDto> {
    const user = await this.repo.findById(userId);
    if (!user)
      throw new NotFoundException('Utilizador não encontrado', COMPONENT);
    return this.repo.update(userId, { role });
  }
}
