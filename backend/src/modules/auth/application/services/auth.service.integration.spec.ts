import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { USERS_REPOSITORY } from 'src/modules/users/application/ports/user.port';
import { SESSIONS_REPOSITORY } from 'src/modules/auth/application/ports/session.port';
import { UsersRepository } from 'src/modules/users/infrastructure/persistence/user.repository';
import { SessionsRepository } from 'src/modules/auth/infrastructure/persistence/session.repository';
import { sql } from 'src/db';
import {
  ConflictException,
  UnauthorizedException,
} from 'src/shared/exceptions/domain.exceptions';

describe('AuthService integration', () => {
  let service: AuthService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USERS_REPOSITORY, useClass: UsersRepository },
        { provide: SESSIONS_REPOSITORY, useClass: SessionsRepository },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  beforeEach(async () => {
    await sql`TRUNCATE TABLE sessions, users CASCADE`;
  });

  afterAll(async () => {
    await sql`TRUNCATE TABLE sessions, users CASCADE`;
  });

  it('should register a new user', async () => {
    const result = await service.register({
      name: 'Integration User',
      email: 'integration@example.com',
      password: 'password123',
    });

    expect(result.user.email).toBe('integration@example.com');
    expect(result.user.name).toBe('Integration User');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('should reject duplicate email registration', async () => {
    await service.register({
      name: 'User A',
      email: 'dup@example.com',
      password: 'password123',
    });

    await expect(
      service.register({
        name: 'User B',
        email: 'dup@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should login with valid credentials', async () => {
    await service.register({
      name: 'Login User',
      email: 'login@example.com',
      password: 'password123',
    });

    const result = await service.login({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(result.user.email).toBe('login@example.com');
    expect(result.accessToken).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    await service.register({
      name: 'Login User',
      email: 'wrongpass@example.com',
      password: 'password123',
    });

    await expect(
      service.login({
        email: 'wrongpass@example.com',
        password: 'wrongpassword',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should logout and revoke session', async () => {
    const { accessToken } = await service.register({
      name: 'Logout User',
      email: 'logout@example.com',
      password: 'password123',
    });

    await service.logout(accessToken);

    const result =
      await sql`SELECT * FROM sessions WHERE token = ${accessToken}`;

    // After logout, session is revoked (is_active = false)
    expect(result.length).toBe(1);
    expect(result[0].is_active).toBe(false);
  });
});
