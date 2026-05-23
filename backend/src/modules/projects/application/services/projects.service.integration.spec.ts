import { Test } from '@nestjs/testing';
import { ProjectsService } from './project.service';
import { PROJECTS_REPOSITORY } from 'src/modules/projects/application/ports/project.port';
import { ProjectsRepository } from 'src/modules/projects/infrastructure/persistence/project.repository';
import { sql, db } from 'src/db';
import { users } from 'src/db/schema';
import { NotFoundException } from 'src/shared/exceptions/domain.exceptions';

describe('ProjectsService integration', () => {
  let service: ProjectsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PROJECTS_REPOSITORY, useClass: ProjectsRepository },
      ],
    }).compile();

    service = module.get(ProjectsService);
  });

  beforeEach(async () => {
    await sql`TRUNCATE TABLE projects, users CASCADE`;
  });

  afterAll(async () => {
    await sql`TRUNCATE TABLE projects, users CASCADE`;
  });

  async function createUser() {
    const [user] = await db
      .insert(users)
      .values({
        name: 'Project Owner',
        email: 'owner@projects.local',
        emailHash: 'hash_owner',
        passwordHash: 'hash',
        role: 'user',
        isActive: true,
      })
      .returning();
    return user.id;
  }

  it('should create a project', async () => {
    const userId = await createUser();
    const result = await service.create(
      { name: 'New Project', description: 'A test project' },
      userId,
    );

    expect(result.name).toBe('New Project');
    expect(result.createdBy.id).toBe(userId);
  });

  it('should find project by id', async () => {
    const userId = await createUser();
    const created = await service.create({ name: 'Find Me' }, userId);

    const result = await service.findById(created.id);

    expect(result.id).toBe(created.id);
    expect(result.name).toBe('Find Me');
  });

  it('should update a project', async () => {
    const userId = await createUser();
    const created = await service.create({ name: 'Old Name' }, userId);

    const result = await service.update(
      created.id,
      { name: 'Updated Name' },
      userId,
      'user',
    );

    expect(result.name).toBe('Updated Name');
  });

  it('should delete a project', async () => {
    const userId = await createUser();
    const created = await service.create({ name: 'To Delete' }, userId);

    await service.delete(created.id, userId, 'user');

    await expect(service.findById(created.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should list all projects', async () => {
    const userId = await createUser();
    await service.create({ name: 'Project A' }, userId);
    await service.create({ name: 'Project B' }, userId);

    const result = await service.findAll();

    expect(result.data.length).toBe(2);
    expect(result.pagination.totalItems).toBe(2);
  });

  it('should throw NotFoundException for non-existent project', async () => {
    await expect(
      service.findById('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
