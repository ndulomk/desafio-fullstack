import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from 'src/middlewares/roles.guard';
import { ForbiddenException } from 'src/shared/exceptions/domain.exceptions';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createContext = (role: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: { role } }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get(RolesGuard);
    reflector = module.get(Reflector);
  });

  it('should allow access when no roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    expect(guard.canActivate(createContext('user'))).toBe(true);
  });

  it('should allow access when user has required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);

    expect(guard.canActivate(createContext('admin'))).toBe(true);
  });

  it('should throw ForbiddenException when user tries admin route', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);

    expect(() => guard.canActivate(createContext('user'))).toThrow(
      ForbiddenException,
    );
  });
});
