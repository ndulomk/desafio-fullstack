import { Injectable, Inject } from '@nestjs/common';
import {
  type ICommentsRepository,
  COMMENTS_REPOSITORY,
} from '../ports/comment.port';
import {
  type ITasksRepository,
  TASKS_REPOSITORY,
} from 'src/modules/tasks/application/ports/task.port';
import { CreateCommentDto, CommentResponseDto } from '../dtos/comment.dto';
import {
  NotFoundException,
  ForbiddenException,
} from 'src/shared/exceptions/domain.exceptions';
import {
  type ListResponse,
  normalizePagination,
  buildListResponse,
} from 'src/shared/pagination';

const COMPONENT = 'CommentsService';

@Injectable()
export class CommentsService {
  constructor(
    @Inject(COMMENTS_REPOSITORY) private readonly repo: ICommentsRepository,
    @Inject(TASKS_REPOSITORY) private readonly tasks: ITasksRepository,
  ) {}

  async create(
    taskId: string,
    dto: CreateCommentDto,
    userId: string,
  ): Promise<CommentResponseDto> {
    const task = await this.tasks.findById(taskId);
    if (!task) throw new NotFoundException('Task não encontrada', COMPONENT);
    return this.repo.create({ taskId, userId, content: dto.content });
  }

  async findByTask(
    taskId: string,
    filters?: { page?: number; limit?: number },
  ): Promise<ListResponse<CommentResponseDto>> {
    const { page, pageSize, offset } = normalizePagination({
      page: filters?.page,
      pageSize: filters?.limit,
    });
    const { data, total } = await this.repo.findByTask(taskId, {
      page,
      limit: pageSize,
      offset,
    });
    return buildListResponse(data, total, page, pageSize);
  }

  async delete(
    id: string,
    taskId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const comment = await this.repo.findById(id);
    if (!comment || comment.taskId !== taskId) {
      throw new NotFoundException('Comentário não encontrado', COMPONENT);
    }
    if (comment.user.id !== userId && userRole !== 'admin') {
      throw new ForbiddenException(
        'Apenas o autor ou admin pode eliminar este comentário',
        COMPONENT,
      );
    }
    await this.repo.delete(id);
  }
}
