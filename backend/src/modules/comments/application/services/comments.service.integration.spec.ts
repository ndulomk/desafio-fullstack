import { Test } from '@nestjs/testing';
import { CommentsService } from './comment.service';
import { COMMENTS_REPOSITORY } from 'src/modules/comments/application/ports/comment.port';
import { TASKS_REPOSITORY } from 'src/modules/tasks/application/ports/task.port';
import { CommentsRepository } from 'src/modules/comments/infrastructure/persistence/comment.repository';
import { TasksRepository } from 'src/modules/tasks/infrastructure/persistence/task.repository';
import { ProjectsRepository } from 'src/modules/projects/infrastructure/persistence/project.repository';
import { PROJECTS_REPOSITORY } from 'src/modules/projects/application/ports/project.port';
import { sql, db } from 'src/db';
import { users, projects, tasks } from 'src/db/schema';
import {
  NotFoundException,
  ForbiddenException,
} from 'src/shared/exceptions/domain.exceptions';

describe('CommentsService integration', () => {
  let service: CommentsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: COMMENTS_REPOSITORY, useClass: CommentsRepository },
        { provide: TASKS_REPOSITORY, useClass: TasksRepository },
        { provide: PROJECTS_REPOSITORY, useClass: ProjectsRepository },
      ],
    }).compile();

    service = module.get(CommentsService);
  });

  beforeEach(async () => {
    await sql`TRUNCATE TABLE comments, tasks, projects, users CASCADE`;
  });

  afterAll(async () => {
    await sql`TRUNCATE TABLE comments, tasks, projects, users CASCADE`;
  });

  async function setupTask() {
    const [user] = await db
      .insert(users)
      .values({
        name: 'Comment User',
        email: 'comment@local.com',
        emailHash: 'hash_comment',
        passwordHash: 'hash',
        role: 'user',
        isActive: true,
      })
      .returning();

    const [project] = await db
      .insert(projects)
      .values({ name: 'Comment Project', createdBy: user.id })
      .returning();

    const [task] = await db
      .insert(tasks)
      .values({
        title: 'Comment Task',
        status: 'pending',
        position: 1000,
        projectId: project.id,
        createdByUserId: user.id,
      })
      .returning();

    return { userId: user.id, projectId: project.id, taskId: task.id };
  }

  it('should create a comment on a task', async () => {
    const { userId, taskId } = await setupTask();
    const result = await service.create(
      taskId,
      { content: 'Great work!' },
      userId,
    );

    expect(result.content).toBe('Great work!');
    expect(result.taskId).toBe(taskId);
    expect(result.user.id).toBe(userId);
  });

  it('should throw NotFoundException when task does not exist', async () => {
    const { userId } = await setupTask();
    await expect(
      service.create(
        '00000000-0000-0000-0000-000000000000',
        { content: 'Test' },
        userId,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should find comments by task', async () => {
    const { userId, taskId } = await setupTask();
    await service.create(taskId, { content: 'First comment' }, userId);
    await service.create(taskId, { content: 'Second comment' }, userId);

    const result = await service.findByTask(taskId);

    expect(result.data.length).toBe(2);
    expect(result.pagination.totalItems).toBe(2);
  });

  it('should allow author to delete comment', async () => {
    const { userId, taskId } = await setupTask();
    const comment = await service.create(
      taskId,
      { content: 'Delete me' },
      userId,
    );

    await service.delete(comment.id, taskId, userId, 'user');

    const result = await service.findByTask(taskId);
    expect(result.data.length).toBe(0);
  });

  it('should allow admin to delete any comment', async () => {
    const { userId, taskId } = await setupTask();
    const comment = await service.create(
      taskId,
      { content: 'Admin delete' },
      userId,
    );

    await service.delete(comment.id, taskId, 'different-user-id', 'admin');

    const result = await service.findByTask(taskId);
    expect(result.data.length).toBe(0);
  });

  it('should throw ForbiddenException when non-author tries to delete', async () => {
    const { userId, taskId } = await setupTask();
    const comment = await service.create(
      taskId,
      { content: 'Protected' },
      userId,
    );

    await expect(
      service.delete(comment.id, taskId, 'different-user-id', 'user'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
