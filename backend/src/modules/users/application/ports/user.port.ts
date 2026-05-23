import type { UserResponseDto } from '../dtos/user.dto';
import type { DbOrTx } from 'src/db/transaction';

export interface FindAllFilters {
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  offset?: number;
}

export interface IUsersRepository {
  create(
    data: {
      name: string;
      email: string;
      emailHash: string;
      passwordHash: string;
      role?: 'user' | 'admin';
    },
    db?: DbOrTx,
  ): Promise<UserResponseDto>;

  findById(id: string): Promise<UserResponseDto | null>;

  findByEmailHash(
    emailHash: string,
  ): Promise<(UserResponseDto & { passwordHash: string }) | null>;

  update(
    id: string,
    data: Partial<{ name: string; isActive: boolean; role: 'user' | 'admin' }>,
    db?: DbOrTx,
  ): Promise<UserResponseDto>;

  findAll(
    filters?: FindAllFilters,
  ): Promise<{ data: UserResponseDto[]; total: number }>;
}

export const USERS_REPOSITORY = Symbol('IUsersRepository');
