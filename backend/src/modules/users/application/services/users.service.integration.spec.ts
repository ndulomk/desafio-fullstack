import { Test } from '@nestjs/testing';
import { UsersService } from './user.service';
import { USERS_REPOSITORY } from 'src/modules/users/application/ports/user.port';
import { UsersRepository } from 'src/modules/users/infrastructure/persistence/user.repository';
import { sql, db } from 'src/db';
import { users } from 'src/db/schema';
import { NotFoundException } from 'src/shared/exceptions/domain.exceptions';

describe('UsersService integration', () => {
  let service: UsersService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USERS_REPOSITORY, useClass: UsersRepository },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  beforeEach(async () => {
    await sql`TRUNCATE TABLE users CASCADE`;
  });

  afterAll(async () => {
    await sql`TRUNCATE TABLE users CASCADE`;
  });

  async function createUser(
    email: string,
    name: string,
    role: 'user' | 'admin' = 'user',
  ) {
    const [userRow] = await db
      .insert(users)
      .values({
        name,
        email,
        emailHash: `hash_${email}`,
        passwordHash: 'hash',
        role,
        isActive: true,
      })
      .returning();
    return userRow.id;
  }

  it('should get profile of authenticated user', async () => {
    const id = await createUser('test@users.local', 'Test User');
    const result = await service.getProfile(id, id, 'user');

    expect(result.id).toBe(id);
    expect(result.email).toBe('test@users.local');
  });

  it('should update profile name', async () => {
    const id = await createUser('update@users.local', 'Old Name');
    const result = await service.updateProfile(id, { name: 'Updated Name' });

    expect(result.name).toBe('Updated Name');
  });

  it('should allow admin to get any user profile', async () => {
    const id = await createUser('admin@test.com', 'Admin View');
    const result = await service.getProfile(id, id, 'admin');

    expect(result.id).toBe(id);
  });

  it('should update user role', async () => {
    const id = await createUser('role@test.com', 'Role User');
    const result = await service.updateRole(id, 'admin');

    expect(result.role).toBe('admin');
  });

  it('should list all users', async () => {
    await createUser('u1@test.com', 'User One');
    await createUser('u2@test.com', 'User Two', 'admin');

    const result = await service.listAll();

    expect(result.data.length).toBe(2);
    expect(result.pagination.totalItems).toBe(2);
  });

  it('should throw NotFoundException for non-existent user', async () => {
    await expect(
      service.getProfile(
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000000',
        'admin',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
