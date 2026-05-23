import type {
  TaskResponseDto,
  TaskStatus,
  UpdateTaskDto,
} from '../dtos/task.dto';
import type { DbOrTx } from 'src/db/transaction';

export interface TaskFindAllFilters {
  projectId?: string;
  status?: TaskStatus;
  assignedToUserId?: string;
  page?: number;
  limit?: number;
  offset?: number;
}

export interface ITasksRepository {
  create(
    data: {
      title: string;
      description?: string;
      status: TaskStatus;
      position: number;
      projectId: string;
      assignedToUserId?: string;
      createdByUserId: string;
    },
    db?: DbOrTx,
  ): Promise<TaskResponseDto>;

  findById(id: string): Promise<TaskResponseDto | null>;

  findByProject(
    projectId: string,
    filters?: { status?: TaskStatus; page?: number; limit?: number },
  ): Promise<{ data: TaskResponseDto[]; total: number }>;

  findAll(
    filters?: TaskFindAllFilters,
  ): Promise<{ data: TaskResponseDto[]; total: number }>;

  update(
    id: string,
    data: Partial<
      UpdateTaskDto & {
        status?: TaskStatus;
        position?: number;
        updatedByUserId?: string;
      }
    >,
    db?: DbOrTx,
  ): Promise<TaskResponseDto>;

  delete(id: string, db?: DbOrTx): Promise<void>;

  getMaxPosition(
    projectId: string,
    status: TaskStatus,
    db?: DbOrTx,
  ): Promise<number>;

  getNeighbourPositions(
    projectId: string,
    status: TaskStatus,
    afterId?: string,
    beforeId?: string,
    db?: DbOrTx,
  ): Promise<{ after: number | null; before: number | null }>;

  renumberColumn(
    projectId: string,
    status: TaskStatus,
    db?: DbOrTx,
  ): Promise<void>;
}

export const TASKS_REPOSITORY = Symbol('ITasksRepository');
