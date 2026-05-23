jest.mock('src/db/transaction', () => ({
  withTransaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn({})),
}));

import { Test } from '@nestjs/testing';
import { TasksService } from './task.service';
import { TASKS_REPOSITORY } from 'src/modules/tasks/application/ports/task.port';
import { PROJECTS_REPOSITORY } from 'src/modules/projects/application/ports/project.port';
import { NotFoundException } from 'src/shared/exceptions/domain.exceptions';
import type { ITasksRepository } from 'src/modules/tasks/application/ports/task.port';
import type { IProjectsRepository } from 'src/modules/projects/application/ports/project.port';
import type { TaskResponseDto } from 'src/modules/tasks/application/dtos/task.dto';

describe('TasksService', () => {
  let service: TasksService;
  let tasksRepo: jest.Mocked<ITasksRepository>;
  let projectsRepo: jest.Mocked<IProjectsRepository>;

  const mockTask = (overrides?: Partial<TaskResponseDto>): TaskResponseDto => ({
    id: 't1',
    title: 'Task 1',
    description: null,
    status: 'pending',
    position: 1000,
    project: { id: 'p1', name: 'Project 1' },
    assignedTo: null,
    createdBy: {
      id: 'u1',
      name: 'User',
      email: 'user@test.com',
      role: 'user',
      isActive: true,
      createdAt: new Date(),
    },
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    tasksRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getMaxPosition: jest.fn(),
      getNeighbourPositions: jest.fn(),
      renumberColumn: jest.fn(),
    } as unknown as jest.Mocked<ITasksRepository>;

    projectsRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TASKS_REPOSITORY, useValue: tasksRepo },
        { provide: PROJECTS_REPOSITORY, useValue: projectsRepo },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  describe('create', () => {
    it('should create task with correct position', async () => {
      projectsRepo.findById.mockResolvedValue({
        id: 'p1',
        name: 'Project 1',
        description: null,
        createdBy: mockTask().createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      tasksRepo.getMaxPosition.mockResolvedValue(0);
      tasksRepo.create.mockResolvedValue(mockTask());

      await service.create(
        { title: 'New', projectId: 'p1', status: 'pending' },
        'u1',
      );

      expect(tasksRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ position: 1000, createdByUserId: 'u1' }),
      );
    });

    it('should throw NotFoundException when project does not exist', async () => {
      projectsRepo.findById.mockResolvedValue(null);

      await expect(
        service.create(
          { title: 'New', projectId: 'p1', status: 'pending' },
          'u1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('changeStatus', () => {
    it('should change status', async () => {
      tasksRepo.findById.mockResolvedValue(mockTask());
      tasksRepo.update.mockResolvedValue(mockTask({ status: 'done' }));

      await service.changeStatus('t1', { status: 'done' }, 'u1');

      expect(tasksRepo.update).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({ status: 'done', updatedByUserId: 'u1' }),
      );
    });
  });

  describe('move', () => {
    it('should move task between columns', async () => {
      tasksRepo.findById.mockResolvedValue(mockTask());
      tasksRepo.getMaxPosition.mockResolvedValue(2000);
      tasksRepo.update.mockResolvedValue(
        mockTask({ status: 'done', position: 3000 }),
      );

      await service.move('t1', { status: 'done' }, 'u1');

      expect(tasksRepo.update).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({
          status: 'done',
          position: 3000,
          updatedByUserId: 'u1',
        }),
      );
    });
  });

  describe('reorder', () => {
    it('should reorder and renumber when gap < 1', async () => {
      tasksRepo.findById.mockResolvedValue(mockTask());
      tasksRepo.getNeighbourPositions.mockResolvedValueOnce({
        after: 1000,
        before: 1001,
      });
      tasksRepo.renumberColumn.mockResolvedValue(undefined);
      tasksRepo.getNeighbourPositions.mockResolvedValueOnce({
        after: 1000,
        before: 2000,
      });
      tasksRepo.update.mockResolvedValue(mockTask({ position: 1500 }));

      await service.reorder('t1', { afterId: 't2', beforeId: 't3' }, 'u1');

      expect(tasksRepo.renumberColumn).toHaveBeenCalled();
      expect(tasksRepo.update).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({ position: 1500, updatedByUserId: 'u1' }),
        expect.anything(),
      );
    });
  });
});
