import { Injectable } from '@nestjs/common';
import { eq, desc, count } from 'drizzle-orm';
import { db } from 'src/db';
import { projects, users } from 'src/db/schema';
import type { IProjectsRepository } from '../../application/ports/project.port';
import type { ProjectResponseDto } from '../../application/dtos/project.dto';
import type { DbOrTx } from 'src/db/transaction';
import { dbExec } from 'src/db/db-exec';
import {
  decryptFields,
  createCryptoConfig,
} from '../../../../shared/crypto/crypto-fields';

const USER_CRYPTO = createCryptoConfig(['email', 'name']);

function toDto(
  row: typeof projects.$inferSelect,
  creator: typeof users.$inferSelect,
): ProjectResponseDto {
  const d = decryptFields(creator, USER_CRYPTO);
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    createdBy: {
      id: creator.id,
      name: d.name,
      email: d.email,
      role: creator.role,
      isActive: creator.isActive,
      createdAt: creator.createdAt,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class ProjectsRepository implements IProjectsRepository {
  async create(
    data: { name: string; description?: string; createdBy: string },
    tx?: DbOrTx,
  ): Promise<ProjectResponseDto> {
    return dbExec('create', 'ProjectsRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      const [row] = await conn
        .insert(projects)
        .values({
          name: data.name,
          description: data.description,
          createdBy: data.createdBy,
        })
        .returning();
      const [creator] = await db
        .select()
        .from(users)
        .where(eq(users.id, row.createdBy))
        .limit(1);
      return toDto(row, creator);
    });
  }

  async findById(id: string): Promise<ProjectResponseDto | null> {
    return dbExec('findById', 'ProjectsRepository', async () => {
      const [row] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);
      if (!row) return null;
      const [creator] = await db
        .select()
        .from(users)
        .where(eq(users.id, row.createdBy))
        .limit(1);
      return toDto(row, creator);
    });
  }

  async findAll(filters?: {
    page?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ProjectResponseDto[]; total: number }> {
    return dbExec('findAll', 'ProjectsRepository', async () => {
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const offset = filters?.offset ?? (page - 1) * limit;

      const [rows, totals] = await Promise.all([
        db
          .select()
          .from(projects)
          .orderBy(desc(projects.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(projects),
      ]);

      // Batch-load creators
      const creatorIds = [...new Set(rows.map((r) => r.createdBy))];
      const creators = creatorIds.length
        ? await db
            .select()
            .from(users)
            .where(
              creatorIds.length === 1 ? eq(users.id, creatorIds[0]) : undefined, // fallback — filter in memory for small sets
            )
        : [];
      const creatorMap = Object.fromEntries(creators.map((u) => [u.id, u]));

      return {
        data: rows.map((r) => toDto(r, creatorMap[r.createdBy])),
        total: totals[0].count,
      };
    });
  }

  async update(
    id: string,
    data: Partial<{ name: string; description: string }>,
    tx?: DbOrTx,
  ): Promise<ProjectResponseDto> {
    return dbExec('update', 'ProjectsRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      const [row] = await conn
        .update(projects)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();
      const [creator] = await db
        .select()
        .from(users)
        .where(eq(users.id, row.createdBy))
        .limit(1);
      return toDto(row, creator);
    });
  }

  async delete(id: string, tx?: DbOrTx): Promise<void> {
    return dbExec('delete', 'ProjectsRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      await conn.delete(projects).where(eq(projects.id, id));
    });
  }
}
