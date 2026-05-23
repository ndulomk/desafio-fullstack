import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../shared/api';
import type { User, UpdateProfileDto, UpdateRoleDto, UserListParams, ListResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  readonly #api = inject(ApiService);

  // GET /users/me
  getMe() {
    return this.#api.get<User>('/users/me');
  }

  // PATCH /users/me
  updateMe(dto: UpdateProfileDto) {
    return this.#api.patch<User>('/users/me', dto);
  }

  // GET /users  (admin)
  listAll(params?: UserListParams) {
    return this.#api.get<ListResponse<User>>('/users', params as Record<string, unknown>);
  }

  // PATCH /users/:id/role  (admin)
  updateRole(id: string, dto: UpdateRoleDto) {
    return this.#api.patch<User>(`/users/${id}/role`, dto);
  }
}