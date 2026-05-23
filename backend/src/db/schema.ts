import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const id = () =>
  uuid('id')
    .primaryKey()
    .default(sql`uuid_generate_v4()`);
const now = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true }).defaultNow().notNull();

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: id(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailHash: text('email_hash').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull().default('user'),
    // user | admin
    isActive: boolean('is_active').notNull().default(true),
    createdAt: now(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    emailHashIdx: uniqueIndex('users_email_hash_idx').on(t.emailHash),
    roleIdx: index('users_role_idx').on(t.role),
    isActiveIdx: index('users_is_active_idx').on(t.isActive),
  }),
);

// ─────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────
export const sessions = pgTable(
  'sessions',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    refreshToken: text('refresh_token'),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    isActive: boolean('is_active').notNull().default(true),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: now(),
    updatedAt: updatedAt(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => ({
    userIdx: index('sessions_user_idx').on(t.userId),
    tokenIdx: uniqueIndex('sessions_token_idx').on(t.token),
    refreshTokenIdx: uniqueIndex('sessions_refresh_token_idx').on(
      t.refreshToken,
    ),
    expiresAtIdx: index('sessions_expires_at_idx').on(t.expiresAt),
  }),
);

// ─────────────────────────────────────────────
// PROJECTS
// created_by: RESTRICT — projecto nao perde contexto do criador
// ─────────────────────────────────────────────
export const projects = pgTable(
  'projects',
  {
    id: id(),
    name: text('name').notNull(),
    description: text('description'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: now(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    createdByIdx: index('projects_created_by_idx').on(t.createdBy),
    nameIdx: index('projects_name_idx').on(t.name),
  }),
);

// ─────────────────────────────────────────────
// TASKS
// project_id:          CASCADE  — projecto deletado leva as tarefas
// assigned_to_user_id: SET NULL — tarefa nao morre se responsavel sair
// created_by_user_id:  RESTRICT — auditoria imutavel
//
// Posicao: inteiros com gaps de 1000.
// Insercao entre A e B: floor((posA + posB) / 2).
// Gap < 1 → renumera toda a coluna (index × 1000).
// ─────────────────────────────────────────────
export const tasks = pgTable(
  'tasks',
  {
    id: id(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull().default('pending'),
    // pending | in_progress | testing | done
    position: integer('position').notNull().default(1000),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    assignedToUserId: uuid('assigned_to_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: now(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    projectIdx: index('tasks_project_idx').on(t.projectId),
    statusIdx: index('tasks_status_idx').on(t.projectId, t.status),
    positionIdx: index('tasks_position_idx').on(
      t.projectId,
      t.status,
      t.position,
    ),
    assignedIdx: index('tasks_assigned_idx').on(t.assignedToUserId),
    createdIdx: index('tasks_created_by_idx').on(t.createdByUserId),
    updatedIdx: index('tasks_updated_by_idx').on(t.updatedByUserId),
  }),
);

// ─────────────────────────────────────────────
// COMMENTS
// task_id:  CASCADE  — tarefa deletada leva comentarios
// user_id:  RESTRICT — comentario nao perde o autor (historico)
// Sem updatedAt — comentarios sao imutaveis por decisao de design.
// ─────────────────────────────────────────────
export const comments = pgTable(
  'comments',
  {
    id: id(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    content: text('content').notNull(),
    createdAt: now(),
  },
  (t) => ({
    taskIdx: index('comments_task_idx').on(t.taskId),
    userIdx: index('comments_user_idx').on(t.userId),
  }),
);

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  projects: many(projects),
  tasksCreated: many(tasks, { relationName: 'taskCreator' }),
  tasksAssigned: many(tasks, { relationName: 'taskAssignee' }),
  comments: many(comments),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToUserId],
    references: [users.id],
    relationName: 'taskAssignee',
  }),
  createdBy: one(users, {
    fields: [tasks.createdByUserId],
    references: [users.id],
    relationName: 'taskCreator',
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type UserRole = 'user' | 'admin';
export type TaskStatus = 'pending' | 'in_progress' | 'testing' | 'done';
