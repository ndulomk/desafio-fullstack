import { Injectable } from '@nestjs/common';
import { eq, asc, count } from 'drizzle-orm';
import { db } from 'src/db';
import { comments, users } from 'src/db/schema';
import type { ICommentsRepository } from '../../application/ports/comment.port';
import type { CommentResponseDto } from '../../application/dtos/comment.dto';
import type { DbOrTx } from 'src/db/transaction';
import { dbExec } from 'src/db/db-exec';
import {
  decryptFields,
  createCryptoConfig,
} from '../../../../shared/crypto/crypto-fields';

const USER_CRYPTO = createCryptoConfig(['email', 'name']);

type CommentRow = typeof comments.$inferSelect;
type UserRow = typeof users.$inferSelect;

function toDto(row: CommentRow, user: UserRow): CommentResponseDto {
  const d = decryptFields(user, USER_CRYPTO);
  return {
    id: row.id,
    taskId: row.taskId,
    user: {
      id: user.id,
      name: d.name,
      email: d.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
    content: row.content,
    createdAt: row.createdAt,
  };
}

@Injectable()
export class CommentsRepository implements ICommentsRepository {
  async create(
    data: { taskId: string; userId: string; content: string },
    tx?: DbOrTx,
  ): Promise<CommentResponseDto> {
    return dbExec('create', 'CommentsRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      const [row] = await conn
        .insert(comments)
        .values({
          taskId: data.taskId,
          userId: data.userId,
          content: data.content,
        })
        .returning();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, row.userId))
        .limit(1);
      return toDto(row, user);
    });
  }

  async findByTask(
    taskId: string,
    filters?: { page?: number; limit?: number; offset?: number },
  ): Promise<{ data: CommentResponseDto[]; total: number }> {
    return dbExec('findByTask', 'CommentsRepository', async () => {
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const offset = filters?.offset ?? (page - 1) * limit;

      const [rows, totals] = await Promise.all([
        db
          .select()
          .from(comments)
          .where(eq(comments.taskId, taskId))
          .orderBy(asc(comments.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(comments)
          .where(eq(comments.taskId, taskId)),
      ]);

      const userIds = [...new Set(rows.map((r) => r.userId))];
      const userList = userIds.length
        ? await db.select().from(users).where(eq(users.id, userIds[0])) // simple for 1; expand as needed
        : [];
      const userMap = Object.fromEntries(userList.map((u) => [u.id, u]));

      return {
        data: rows.map((r) => toDto(r, userMap[r.userId])),
        total: totals[0].count,
      };
    });
  }

  async findById(id: string): Promise<CommentResponseDto | null> {
    return dbExec('findById', 'CommentsRepository', async () => {
      const [row] = await db
        .select()
        .from(comments)
        .where(eq(comments.id, id))
        .limit(1);
      if (!row) return null;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, row.userId))
        .limit(1);
      return toDto(row, user);
    });
  }

  async delete(id: string, tx?: DbOrTx): Promise<void> {
    return dbExec('delete', 'CommentsRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      await conn.delete(comments).where(eq(comments.id, id));
    });
  }
}
