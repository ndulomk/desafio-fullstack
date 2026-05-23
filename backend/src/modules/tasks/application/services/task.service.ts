import { Injectable, Inject } from '@nestjs/common';
import {
  type ITasksRepository,
  TASKS_REPOSITORY,
  TaskFindAllFilters,
} from '../ports/task.port';
import {
  type IProjectsRepository,
  PROJECTS_REPOSITORY,
} from 'src/modules/projects/application/ports/project.port';
import {
  CreateTaskDto,
  UpdateTaskDto,
  ChangeStatusDto,
  MoveTaskDto,
  ReorderTaskDto,
  TaskResponseDto,
} from '../dtos/task.dto';
import {
  NotFoundException,
  ForbiddenException,
} from 'src/shared/exceptions/domain.exceptions';
import { withTransaction } from 'src/db/transaction';
import {
  type ListResponse,
  normalizePagination,
  buildListResponse,
} from 'src/shared/pagination';

const COMPONENT = 'TasksService';
const POSITION_GAP = 1000;

@Injectable()
export class TasksService {
  constructor(
    @Inject(TASKS_REPOSITORY) private readonly repo: ITasksRepository,
    @Inject(PROJECTS_REPOSITORY) private readonly projects: IProjectsRepository,
  ) {}

  async create(dto: CreateTaskDto, userId: string): Promise<TaskResponseDto> {
    const project = await this.projects.findById(dto.projectId);
    if (!project)
      throw new NotFoundException('Projecto não encontrado', COMPONENT);

    const maxPos = await this.repo.getMaxPosition(dto.projectId, dto.status);
    const position = maxPos + POSITION_GAP;

    return this.repo.create({
      title: dto.title,
      description: dto.description,
      status: dto.status,
      position,
      projectId: dto.projectId,
      assignedToUserId: dto.assignedToUserId,
      createdByUserId: userId,
    });
  }

  async findAll(
    filters?: TaskFindAllFilters,
  ): Promise<ListResponse<TaskResponseDto>> {
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

  async findById(id: string): Promise<TaskResponseDto> {
    const task = await this.repo.findById(id);
    if (!task) throw new NotFoundException('Task não encontrada', COMPONENT);
    return task;
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    userId: string,
  ): Promise<TaskResponseDto> {
    const task = await this.findById(id);
    this.assertOwnerOrAdmin(task.createdBy.id, userId, 'user');
    return this.repo.update(id, { ...dto, updatedByUserId: userId });
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const task = await this.findById(id);
    this.assertOwnerOrAdmin(task.createdBy.id, userId, userRole);
    await this.repo.delete(id);
  }

  async changeStatus(
    id: string,
    dto: ChangeStatusDto,
    userId: string,
  ): Promise<TaskResponseDto> {
    await this.findById(id);
    return this.repo.update(id, {
      status: dto.status,
      updatedByUserId: userId,
    });
  }

  async move(
    id: string,
    dto: MoveTaskDto,
    userId: string,
  ): Promise<TaskResponseDto> {
    await this.findById(id);

    const task = await this.repo.findById(id);
    const maxPos = await this.repo.getMaxPosition(task.project.id, dto.status);
    const position = maxPos + POSITION_GAP;

    return this.repo.update(id, {
      status: dto.status,
      position,
      updatedByUserId: userId,
    });
  }

  async reorder(
    id: string,
    dto: ReorderTaskDto,
    userId: string,
  ): Promise<TaskResponseDto> {
    const task = await this.findById(id);

    return withTransaction(async (tx) => {
      const { after, before } = await this.repo.getNeighbourPositions(
        task.project.id,
        task.status,
        dto.afterId,
        dto.beforeId,
        tx,
      );

      const posAfter = after ?? 0;
      const posBefore = before ?? posAfter + POSITION_GAP * 2;

      let newPosition = Math.floor((posAfter + posBefore) / 2);

      if (newPosition === posAfter || newPosition === posBefore) {
        await this.repo.renumberColumn(task.project.id, task.status, tx);

        const { after: a2, before: b2 } = await this.repo.getNeighbourPositions(
          task.project.id,
          task.status,
          dto.afterId,
          dto.beforeId,
          tx,
        );
        const pa2 = a2 ?? 0;
        const pb2 = b2 ?? pa2 + POSITION_GAP * 2;
        newPosition = Math.floor((pa2 + pb2) / 2);
      }

      return this.repo.update(
        id,
        { position: newPosition, updatedByUserId: userId },
        tx,
      );
    });
  }

  private assertOwnerOrAdmin(
    ownerId: string,
    requesterId: string,
    role: string,
  ) {
    if (ownerId !== requesterId && role !== 'admin') {
      throw new ForbiddenException(
        'Apenas o criador ou admin pode modificar esta task',
        COMPONENT,
      );
    }
  }
}
