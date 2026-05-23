import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { USERS_REPOSITORY } from 'src/modules/users/application/ports/user.port';
import { SESSIONS_REPOSITORY } from 'src/modules/auth/application/ports/session.port';
import {
  ConflictException,
  UnauthorizedException,
} from 'src/shared/exceptions/domain.exceptions';
import type { IUsersRepository } from 'src/modules/users/application/ports/user.port';
import type { ISessionsRepository } from 'src/modules/auth/application/ports/session.port';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  verify: jest.fn().mockResolvedValue(false),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: jest.Mocked<IUsersRepository>;
  let sessionsRepo: jest.Mocked<ISessionsRepository>;

  beforeEach(async () => {
    usersRepo = {
      findByEmailHash: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<IUsersRepository>;

    sessionsRepo = {
      create: jest.fn(),
      findByToken: jest.fn(),
      findByRefreshToken: jest.fn(),
      revoke: jest.fn(),
      revokeAllByUser: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USERS_REPOSITORY, useValue: usersRepo },
        { provide: SESSIONS_REPOSITORY, useValue: sessionsRepo },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('should throw ConflictException when email already exists', async () => {
      usersRepo.findByEmailHash.mockResolvedValue({
        id: 'u1',
        name: 'John',
        email: 'john@example.com',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        passwordHash: 'hash',
      });

      await expect(
        service.register({
          name: 'John',
          email: 'john@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for wrong password', async () => {
      usersRepo.findByEmailHash.mockResolvedValue({
        id: 'u1',
        name: 'John',
        email: 'john@example.com',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        passwordHash: 'fake-hash',
      });

      await expect(
        service.login({ email: 'john@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke session by token', async () => {
      sessionsRepo.findByToken.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        token: 't1',
        refreshToken: 'r1',
        isActive: true,
        expiresAt: new Date(Date.now() + 3600_000),
      });

      await service.logout('t1');

      expect(sessionsRepo.revoke).toHaveBeenCalledWith('s1');
    });

    it('should do nothing when token not found', async () => {
      sessionsRepo.findByToken.mockResolvedValue(null);

      await service.logout('unknown');

      expect(sessionsRepo.revoke).not.toHaveBeenCalled();
    });
  });
});
