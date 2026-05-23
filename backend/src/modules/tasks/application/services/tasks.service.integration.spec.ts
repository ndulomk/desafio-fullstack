import { Test } from '@nestjs/testing';
import { TasksService } from './task.service';
import { TASKS_REPOSITORY } from 'src/modules/tasks/application/ports/task.port';
import { PROJECTS_REPOSITORY } from 'src/modules/projects/application/ports/project.port';
import { TasksRepository } from 'src/modules/tasks/infrastructure/persistence/task.repository';
import { ProjectsRepository } from 'src/modules/projects/infrastructure/persistence/project.repository';
import { sql, db } from 'src/db';
import { users, projects, tasks } from 'src/db/schema';
import { eq } from 'drizzle-orm';

describe('TasksService integration', () => {
  let service: TasksService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TASKS_REPOSITORY, useClass: TasksRepository },
        { provide: PROJECTS_REPOSITORY, useClass: ProjectsRepository },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  beforeEach(async () => {
    await sql`TRUNCATE TABLE tasks, projects, users CASCADE`;
  });

  afterAll(async () => {
    await sql`TRUNCATE TABLE tasks, projects, users CASCADE`;
  });

  async function setupProject() {
    const [user] = await db
      .insert(users)
      .values({
        name: 'Test User',
        email: 'test@integration.com',
        emailHash: 'hash_test_integration',
        passwordHash: 'hash',
        role: 'user',
        isActive: true,
      })
      .returning();

    const [project] = await db
      .insert(projects)
      .values({ name: 'Integration Project', createdBy: user.id })
      .returning();

    return { userId: user.id, projectId: project.id };
  }

  it('should create task with correct position', async () => {
    const { userId, projectId } = await setupProject();
    const result = await service.create(
      { title: 'Task A', projectId, status: 'pending' },
      userId,
    );

    expect(result.title).toBe('Task A');
    expect(result.position).toBe(1000);
    expect(result.createdBy.id).toBe(userId);
  });

  it('should reorder and renumber when gap < 1', async () => {
    const { userId, projectId } = await setupProject();
    const t1 = await service.create(
      { title: 'T1', projectId, status: 'pending' },
      userId,
    );
    const t2 = await service.create(
      { title: 'T2', projectId, status: 'pending' },
      userId,
    );

    // Forçar posições próximas para forçar renumber
    await db.update(tasks).set({ position: 1001 }).where(eq(tasks.id, t2.id));

    await service.reorder(t2.id, { afterId: t1.id }, userId);
  });

  it('should move task between columns', async () => {
    const { userId, projectId } = await setupProject();
    const task = await service.create(
      { title: 'Move me', projectId, status: 'pending' },
      userId,
    );

    const result = await service.move(task.id, { status: 'done' }, userId);

    expect(result.status).toBe('done');
  });
});
