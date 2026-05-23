import { Test } from '@nestjs/testing';
import { CommentsService } from './comment.service';
import { COMMENTS_REPOSITORY } from 'src/modules/comments/application/ports/comment.port';
import { TASKS_REPOSITORY } from 'src/modules/tasks/application/ports/task.port';
import {
  NotFoundException,
  ForbiddenException,
} from 'src/shared/exceptions/domain.exceptions';
import type { ICommentsRepository } from 'src/modules/comments/application/ports/comment.port';
import type { ITasksRepository } from 'src/modules/tasks/application/ports/task.port';
import type { CommentResponseDto } from 'src/modules/comments/application/dtos/comment.dto';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentsRepo: jest.Mocked<ICommentsRepository>;
  let tasksRepo: jest.Mocked<ITasksRepository>;

  const mockUser = {
    id: 'u1',
    name: 'Author',
    email: 'a@test.com',
    role: 'user' as const,
    isActive: true,
    createdAt: new Date(),
  };

  const mockComment = (
    overrides?: Partial<CommentResponseDto>,
  ): CommentResponseDto => ({
    id: 'c1',
    taskId: 't1',
    user: mockUser,
    content: 'Hello',
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    commentsRepo = {
      create: jest.fn(),
      findByTask: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };

    tasksRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ITasksRepository>;

    const module = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: COMMENTS_REPOSITORY, useValue: commentsRepo },
        { provide: TASKS_REPOSITORY, useValue: tasksRepo },
      ],
    }).compile();

    service = module.get(CommentsService);
  });

  describe('create', () => {
    it('should create comment', async () => {
      tasksRepo.findById.mockResolvedValue({
        id: 't1',
        title: 'Task',
        description: null,
        status: 'pending',
        position: 1000,
        project: { id: 'p1', name: 'P' },
        assignedTo: null,
        createdBy: mockUser,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      commentsRepo.create.mockResolvedValue(mockComment());

      const result = await service.create('t1', { content: 'Hello' }, 'u1');

      expect(commentsRepo.create).toHaveBeenCalledWith({
        taskId: 't1',
        userId: 'u1',
        content: 'Hello',
      });
      expect(result.content).toBe('Hello');
    });

    it('should throw NotFoundException when task does not exist', async () => {
      tasksRepo.findById.mockResolvedValue(null);

      await expect(
        service.create('t1', { content: 'Hello' }, 'u1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should allow author to delete', async () => {
      commentsRepo.findById.mockResolvedValue(mockComment({ user: mockUser }));

      await service.delete('c1', 't1', 'u1', 'user');

      expect(commentsRepo.delete).toHaveBeenCalledWith('c1');
    });

    it('should allow admin to delete', async () => {
      commentsRepo.findById.mockResolvedValue(
        mockComment({ user: { ...mockUser, id: 'u2' } }),
      );

      await service.delete('c1', 't1', 'u1', 'admin');

      expect(commentsRepo.delete).toHaveBeenCalledWith('c1');
    });

    it('should throw ForbiddenException when non-author non-admin tries to delete', async () => {
      commentsRepo.findById.mockResolvedValue(
        mockComment({ user: { ...mockUser, id: 'u2' } }),
      );

      await expect(
        service.delete('c1', 't1', 'u1', 'user'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
