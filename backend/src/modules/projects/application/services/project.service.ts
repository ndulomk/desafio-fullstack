import { Injectable, Inject } from '@nestjs/common';
import {
  type IProjectsRepository,
  PROJECTS_REPOSITORY,
} from '../../application/ports/project.port';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectResponseDto,
} from '../dtos/project.dto';
import {
  NotFoundException,
  ForbiddenException,
} from 'src/shared/exceptions/domain.exceptions';
import {
  type ListResponse,
  normalizePagination,
  buildListResponse,
} from 'src/shared/pagination';

const COMPONENT = 'ProjectsService';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly repo: IProjectsRepository,
  ) {}

  async create(
    dto: CreateProjectDto,
    userId: string,
  ): Promise<ProjectResponseDto> {
    return this.repo.create({ ...dto, createdBy: userId });
  }

  async findAll(filters?: {
    page?: number;
    limit?: number;
  }): Promise<ListResponse<ProjectResponseDto>> {
    const { page, pageSize, offset } = normalizePagination({
      page: filters?.page,
      pageSize: filters?.limit,
    });
    const { data, total } = await this.repo.findAll({
      page,
      limit: pageSize,
      offset,
    });
    return buildListResponse(data, total, page, pageSize);
  }

  async findById(id: string): Promise<ProjectResponseDto> {
    const project = await this.repo.findById(id);
    if (!project)
      throw new NotFoundException('Projecto não encontrado', COMPONENT);
    return project;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    userId: string,
    userRole: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.findById(id);
    this.assertOwnerOrAdmin(project.createdBy.id, userId, userRole);
    return this.repo.update(id, dto);
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const project = await this.findById(id);
    this.assertOwnerOrAdmin(project.createdBy.id, userId, userRole);
    await this.repo.delete(id);
  }

  private assertOwnerOrAdmin(
    ownerId: string,
    requesterId: string,
    role: string,
  ) {
    if (ownerId !== requesterId && role !== 'admin') {
      throw new ForbiddenException(
        'Apenas o criador ou admin pode modificar este projecto',
        COMPONENT,
      );
    }
  }
}
