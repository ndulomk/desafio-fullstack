import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../shared/api';
import type { Comment, CommentList, CreateCommentDto, CommentListParams } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class CommentsService {
  readonly #api = inject(ApiService);

  // GET /tasks/:taskId/comments
  list(taskId: string, params?: CommentListParams) {
    return this.#api.get<CommentList>(`/tasks/${taskId}/comments`, params as Record<string, unknown>);
  }

  // POST /tasks/:taskId/comments
  create(taskId: string, dto: CreateCommentDto) {
    return this.#api.post<Comment>(`/tasks/${taskId}/comments`, dto);
  }

  // DELETE /tasks/:taskId/comments/:id
  delete(taskId: string, id: string) {
    return this.#api.delete(`/tasks/${taskId}/comments/${id}`);
  }
}