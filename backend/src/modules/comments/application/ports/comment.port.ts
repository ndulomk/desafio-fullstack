import type { CommentResponseDto } from '../dtos/comment.dto';
import type { DbOrTx } from 'src/db/transaction';

export interface ICommentsRepository {
  create(
    data: { taskId: string; userId: string; content: string },
    db?: DbOrTx,
  ): Promise<CommentResponseDto>;

  findByTask(
    taskId: string,
    filters?: { page?: number; limit?: number; offset?: number },
  ): Promise<{ data: CommentResponseDto[]; total: number }>;

  findById(id: string): Promise<CommentResponseDto | null>;

  delete(id: string, db?: DbOrTx): Promise<void>;
}

export const COMMENTS_REPOSITORY = Symbol('ICommentsRepository');
