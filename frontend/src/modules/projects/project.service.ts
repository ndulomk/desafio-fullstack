import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../shared/api';
import type {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  ProjectListParams,
  TaskList,
  TaskListParams,
  ListResponse,
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  readonly #api = inject(ApiService);

  // GET /projects
  list(params?: ProjectListParams) {
    return this.#api.get<ListResponse<Project>>('/projects', params as Record<string, unknown>);
  }

  // POST /projects
  create(dto: CreateProjectDto) {
    return this.#api.post<Project>('/projects', dto);
  }

  // GET /projects/:id
  get(id: string) {
    return this.#api.get<Project>(`/projects/${id}`);
  }

  // PATCH /projects/:id
  update(id: string, dto: UpdateProjectDto) {
    return this.#api.patch<Project>(`/projects/${id}`, dto);
  }

  // DELETE /projects/:id
  delete(id: string) {
    return this.#api.delete(`/projects/${id}`);
  }

  // GET /projects/:id/tasks
  getTasks(id: string, params?: Omit<TaskListParams, 'projectId'>) {
    return this.#api.get<TaskList>(`/projects/${id}/tasks`, params as Record<string, unknown>);
  }
}