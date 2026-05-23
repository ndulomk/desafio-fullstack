import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { db } from 'src/db';
import { sessions } from 'src/db/schema';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../../application/ports/session.port';
import type { DbOrTx } from 'src/db/transaction';
import { dbExec } from 'src/db/db-exec';

type SessionRow = InferSelectModel<typeof sessions>;

function toRecord(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    userId: row.userId,
    token: row.token,
    refreshToken: row.refreshToken ?? null,
    isActive: row.isActive,
    expiresAt: row.expiresAt,
  };
}

@Injectable()
export class SessionsRepository implements ISessionsRepository {
  async create(
    data: {
      userId: string;
      token: string;
      refreshToken: string;
      userAgent?: string;
      ipAddress?: string;
      expiresAt: Date;
    },
    tx?: DbOrTx,
  ): Promise<SessionRecord> {
    return dbExec('create', 'SessionsRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      const [row] = await conn
        .insert(sessions)
        .values({ ...data, isActive: true })
        .returning();
      return toRecord(row);
    });
  }

  async findByToken(token: string): Promise<SessionRecord | null> {
    return dbExec('findByToken', 'SessionsRepository', async () => {
      const [row] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .limit(1);
      return row ? toRecord(row) : null;
    });
  }

  async findByRefreshToken(token: string): Promise<SessionRecord | null> {
    return dbExec('findByRefreshToken', 'SessionsRepository', async () => {
      const [row] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.refreshToken, token))
        .limit(1);
      return row ? toRecord(row) : null;
    });
  }

  async revoke(sessionId: string, tx?: DbOrTx): Promise<void> {
    return dbExec('revoke', 'SessionsRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      await conn
        .update(sessions)
        .set({ isActive: false, revokedAt: new Date(), updatedAt: new Date() })
        .where(eq(sessions.id, sessionId));
    });
  }

  async revokeAllByUser(userId: string, tx?: DbOrTx): Promise<void> {
    return dbExec('revokeAllByUser', 'SessionsRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      await conn
        .update(sessions)
        .set({ isActive: false, revokedAt: new Date(), updatedAt: new Date() })
        .where(eq(sessions.userId, userId));
    });
  }
}
