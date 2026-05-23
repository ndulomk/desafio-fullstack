import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../shared/api';
import type {
  Task,
  TaskList,
  CreateTaskDto,
  UpdateTaskDto,
  TaskListParams,
  MoveTaskDto,
  ReorderTaskDto,
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class TasksService {
  readonly #api = inject(ApiService);

  // GET /tasks
  list(params?: TaskListParams) {
    return this.#api.get<TaskList>('/tasks', params as Record<string, unknown>);
  }

  // POST /tasks
  create(dto: CreateTaskDto) {
    return this.#api.post<Task>('/tasks', dto);
  }

  // GET /tasks/:id
  get(id: string) {
    return this.#api.get<Task>(`/tasks/${id}`);
  }

  // PATCH /tasks/:id
  update(id: string, dto: UpdateTaskDto) {
    return this.#api.patch<Task>(`/tasks/${id}`, dto);
  }

  // DELETE /tasks/:id
  delete(id: string) {
    return this.#api.delete(`/tasks/${id}`);
  }

  // PATCH /tasks/:id/status
  changeStatus(id: string, status: Task['status']) {
    return this.#api.patch<Task>(`/tasks/${id}/status`, { status });
  }

  // PATCH /tasks/:id/move
  move(id: string, dto: MoveTaskDto) {
    return this.#api.patch<Task>(`/tasks/${id}/move`, dto);
  }

  // PATCH /tasks/:id/position
  reorder(id: string, dto: ReorderTaskDto) {
    return this.#api.patch<Task>(`/tasks/${id}/position`, dto);
  }
}