import { Injectable } from '@nestjs/common';
import { eq, and, asc, max, count, sql, gt } from 'drizzle-orm';
import { db } from 'src/db';
import { tasks, projects, users } from 'src/db/schema';
import type {
  ITasksRepository,
  TaskFindAllFilters,
} from '../../application/ports/task.port';
import type {
  TaskResponseDto,
  TaskStatus,
} from '../../application/dtos/task.dto';
import type { DbOrTx } from 'src/db/transaction';
import { dbExec } from 'src/db/db-exec';
import {
  decryptFields,
  createCryptoConfig,
} from '../../../../shared/crypto/crypto-fields';

const USER_CRYPTO = createCryptoConfig(['email', 'name']);

type TaskRow = typeof tasks.$inferSelect;
type ProjectRow = typeof projects.$inferSelect;
type UserRow = typeof users.$inferSelect;

function toDto(
  row: TaskRow,
  project: ProjectRow,
  creator: UserRow,
  assignee: UserRow | null,
  updater: UserRow | null,
): TaskResponseDto {
  const dc = decryptFields(creator, USER_CRYPTO);
  const da = assignee ? decryptFields(assignee, USER_CRYPTO) : null;
  const du = updater ? decryptFields(updater, USER_CRYPTO) : null;

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    status: row.status as TaskStatus,
    position: row.position,
    project: { id: project.id, name: project.name },
    assignedTo: da
      ? {
          id: assignee.id,
          name: da.name,
          email: da.email,
          role: assignee.role,
          isActive: assignee.isActive,
          createdAt: assignee.createdAt,
        }
      : null,
    createdBy: {
      id: creator.id,
      name: dc.name,
      email: dc.email,
      role: creator.role,
      isActive: creator.isActive,
      createdAt: creator.createdAt,
    },
    updatedBy: du
      ? {
          id: updater.id,
          name: du.name,
          email: du.email,
          role: updater.role,
          isActive: updater.isActive,
          createdAt: updater.createdAt,
        }
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function loadRelations(rows: TaskRow[], conn: typeof db = db) {
  if (!rows.length)
    return { projectMap: {}, creatorMap: {}, assigneeMap: {}, updaterMap: {} };

  const projectIds = [...new Set(rows.map((r) => r.projectId))];
  const creatorIds = [...new Set(rows.map((r) => r.createdByUserId))];
  const assigneeIds = [
    ...new Set(rows.map((r) => r.assignedToUserId).filter(Boolean)),
  ];
  const updaterIds = [
    ...new Set(rows.map((r) => r.updatedByUserId).filter(Boolean)),
  ];

  const [projectList, creatorList, assigneeList, updaterList] =
    await Promise.all([
      conn
        .select()
        .from(projects)
        .where(
          sql`${projects.id} = ANY(ARRAY[${sql.join(
            projectIds.map((id) => sql`${id}::uuid`),
            sql`, `,
          )}])`,
        ),
      conn
        .select()
        .from(users)
        .where(
          sql`${users.id} = ANY(ARRAY[${sql.join(
            creatorIds.map((id) => sql`${id}::uuid`),
            sql`, `,
          )}])`,
        ),
      assigneeIds.length
        ? conn
            .select()
            .from(users)
            .where(
              sql`${users.id} = ANY(ARRAY[${sql.join(
                assigneeIds.map((id) => sql`${id}::uuid`),
                sql`, `,
              )}])`,
            )
        : Promise.resolve([]),
      updaterIds.length
        ? conn
            .select()
            .from(users)
            .where(
              sql`${users.id} = ANY(ARRAY[${sql.join(
                updaterIds.map((id) => sql`${id}::uuid`),
                sql`, `,
              )}])`,
            )
        : Promise.resolve([]),
    ]);

  return {
    projectMap: Object.fromEntries(projectList.map((p) => [p.id, p])),
    creatorMap: Object.fromEntries(creatorList.map((u) => [u.id, u])),
    assigneeMap: Object.fromEntries(
      (assigneeList as UserRow[]).map((u: UserRow) => [u.id, u]),
    ),
    updaterMap: Object.fromEntries(
      (updaterList as UserRow[]).map((u: UserRow) => [u.id, u]),
    ),
  };
}

@Injectable()
export class TasksRepository implements ITasksRepository {
  async create(
    data: {
      title: string;
      description?: string;
      status: TaskStatus;
      position: number;
      projectId: string;
      assignedToUserId?: string;
      createdByUserId: string;
    },
    tx?: DbOrTx,
  ): Promise<TaskResponseDto> {
    return dbExec('create', 'TasksRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      const [row] = await conn
        .insert(tasks)
        .values({
          title: data.title,
          description: data.description,
          status: data.status,
          position: data.position,
          projectId: data.projectId,
          assignedToUserId: data.assignedToUserId,
          createdByUserId: data.createdByUserId,
        })
        .returning();
      const { projectMap, creatorMap, assigneeMap, updaterMap } =
        await loadRelations([row]);
      return toDto(
        row,
        projectMap[row.projectId],
        creatorMap[row.createdByUserId],
        assigneeMap[row.assignedToUserId] ?? null,
        updaterMap[row.updatedByUserId] ?? null,
      );
    });
  }

  async findById(id: string): Promise<TaskResponseDto | null> {
    return dbExec('findById', 'TasksRepository', async () => {
      const [row] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, id))
        .limit(1);
      if (!row) return null;
      const { projectMap, creatorMap, assigneeMap, updaterMap } =
        await loadRelations([row]);
      return toDto(
        row,
        projectMap[row.projectId],
        creatorMap[row.createdByUserId],
        assigneeMap[row.assignedToUserId] ?? null,
        updaterMap[row.updatedByUserId] ?? null,
      );
    });
  }

  async findByProject(
    projectId: string,
    filters?: { status?: TaskStatus; page?: number; limit?: number },
  ): Promise<{ data: TaskResponseDto[]; total: number }> {
    return this.findAll({ projectId, ...filters });
  }

  async findAll(
    filters?: TaskFindAllFilters,
  ): Promise<{ data: TaskResponseDto[]; total: number }> {
    return dbExec('findAll', 'TasksRepository', async () => {
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const offset = filters?.offset ?? (page - 1) * limit;

      const conditions: ReturnType<typeof eq>[] = [];
      if (filters?.projectId)
        conditions.push(eq(tasks.projectId, filters.projectId));
      if (filters?.status) conditions.push(eq(tasks.status, filters.status));
      if (filters?.assignedToUserId)
        conditions.push(eq(tasks.assignedToUserId, filters.assignedToUserId));

      const where = conditions.length ? and(...conditions) : undefined;

      const [rows, totals] = await Promise.all([
        db
          .select()
          .from(tasks)
          .where(where)
          .orderBy(asc(tasks.position))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(tasks).where(where),
      ]);

      const { projectMap, creatorMap, assigneeMap, updaterMap } =
        await loadRelations(rows);

      return {
        data: rows.map((r) =>
          toDto(
            r,
            projectMap[r.projectId],
            creatorMap[r.createdByUserId],
            assigneeMap[r.assignedToUserId] ?? null,
            updaterMap[r.updatedByUserId] ?? null,
          ),
        ),
        total: totals[0].count,
      };
    });
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      assignedToUserId: string | null;
      status: TaskStatus;
      position: number;
      updatedByUserId: string;
    }>,
    tx?: DbOrTx,
  ): Promise<TaskResponseDto> {
    return dbExec('update', 'TasksRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      const payload: Record<string, unknown> = { updatedAt: new Date() };

      if (data.title !== undefined) payload.title = data.title;
      if (data.description !== undefined)
        payload.description = data.description;
      if (data.assignedToUserId !== undefined)
        payload.assignedToUserId = data.assignedToUserId;
      if (data.status !== undefined) payload.status = data.status;
      if (data.position !== undefined) payload.position = data.position;
      if (data.updatedByUserId !== undefined)
        payload.updatedByUserId = data.updatedByUserId;

      const [row] = await conn
        .update(tasks)
        .set(payload)
        .where(eq(tasks.id, id))
        .returning();
      const { projectMap, creatorMap, assigneeMap, updaterMap } =
        await loadRelations([row]);
      return toDto(
        row,
        projectMap[row.projectId],
        creatorMap[row.createdByUserId],
        assigneeMap[row.assignedToUserId] ?? null,
        updaterMap[row.updatedByUserId] ?? null,
      );
    });
  }

  async delete(id: string, tx?: DbOrTx): Promise<void> {
    return dbExec('delete', 'TasksRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      await conn.delete(tasks).where(eq(tasks.id, id));
    });
  }

  async getMaxPosition(
    projectId: string,
    status: TaskStatus,
    tx?: DbOrTx,
  ): Promise<number> {
    return dbExec('getMaxPosition', 'TasksRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      const [row] = await conn
        .select({ max: max(tasks.position) })
        .from(tasks)
        .where(and(eq(tasks.projectId, projectId), eq(tasks.status, status)));
      return row?.max ?? 0;
    });
  }

  async getNeighbourPositions(
    projectId: string,
    status: TaskStatus,
    afterId?: string,
    beforeId?: string,
    tx?: DbOrTx,
  ): Promise<{ after: number | null; before: number | null }> {
    return dbExec('getNeighbourPositions', 'TasksRepository', async () => {
      const conn = (tx ?? db) as typeof db;

      let afterPos: number | null = null;
      let beforePos: number | null = null;

      if (afterId) {
        const [row] = await conn
          .select({ position: tasks.position })
          .from(tasks)
          .where(eq(tasks.id, afterId))
          .limit(1);
        afterPos = row?.position ?? null;
      }

      if (beforeId) {
        const [row] = await conn
          .select({ position: tasks.position })
          .from(tasks)
          .where(eq(tasks.id, beforeId))
          .limit(1);
        beforePos = row?.position ?? null;
      }

      // If only afterId given, find the task immediately after in position order
      if (afterId && !beforeId && afterPos !== null) {
        const [next] = await conn
          .select({ position: tasks.position })
          .from(tasks)
          .where(
            and(
              eq(tasks.projectId, projectId),
              eq(tasks.status, status),
              gt(tasks.position, afterPos),
            ),
          )
          .orderBy(asc(tasks.position))
          .limit(1);
        beforePos = next?.position ?? null;
      }

      return { after: afterPos, before: beforePos };
    });
  }

  async renumberColumn(
    projectId: string,
    status: TaskStatus,
    tx?: DbOrTx,
  ): Promise<void> {
    return dbExec('renumberColumn', 'TasksRepository', async () => {
      const conn = (tx ?? db) as typeof db;

      // Load all tasks in this column ordered by position
      const rows = await conn
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.projectId, projectId), eq(tasks.status, status)))
        .orderBy(asc(tasks.position));

      // Update each with a new position index × 1000
      await Promise.all(
        rows.map((row, idx) =>
          conn
            .update(tasks)
            .set({ position: (idx + 1) * 1000 })
            .where(eq(tasks.id, row.id)),
        ),
      );
    });
  }
}
