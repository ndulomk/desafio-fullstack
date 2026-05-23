import { Injectable } from '@nestjs/common';
import { eq, and, count, asc } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { db } from 'src/db';
import { users } from 'src/db/schema';
import type {
  IUsersRepository,
  FindAllFilters,
} from '../../application/ports/user.port';
import type { UserResponseDto } from '../../application/dtos/user.dto';
import type { DbOrTx } from 'src/db/transaction';
import {
  encryptFields,
  decryptFields,
  createCryptoConfig,
} from '../../../../shared/crypto/crypto-fields';
import { getEncryption } from '../../../../shared/crypto/encryption.service';
import { dbExec } from 'src/db/db-exec';

type UserRow = InferSelectModel<typeof users>;

const CRYPTO_CONFIG = createCryptoConfig(['email', 'name']);

function toDto(row: UserRow): UserResponseDto {
  const d = decryptFields(row, CRYPTO_CONFIG);
  return {
    id: row.id,
    email: d.email,
    name: d.name,
    role: (row.role ?? 'user') as 'user' | 'admin',
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}

@Injectable()
export class UsersRepository implements IUsersRepository {
  private readonly enc = getEncryption();

  async create(
    data: {
      name: string;
      email: string;
      emailHash: string;
      passwordHash: string;
      role?: 'user' | 'admin';
    },
    tx?: DbOrTx,
  ): Promise<UserResponseDto> {
    return dbExec('create', 'UsersRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      const encrypted = encryptFields(data, CRYPTO_CONFIG);
      const [row] = await conn
        .insert(users)
        .values({
          name: encrypted.name,
          email: encrypted.email,
          emailHash: data.emailHash,
          passwordHash: data.passwordHash,
          role: data.role ?? 'user',
        })
        .returning();
      return toDto(row);
    });
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    return dbExec('findById', 'UsersRepository', async () => {
      const [row] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.isActive, true)))
        .limit(1);
      return row ? toDto(row) : null;
    });
  }

  async findByEmailHash(
    emailHash: string,
  ): Promise<(UserResponseDto & { passwordHash: string }) | null> {
    return dbExec('findByEmailHash', 'UsersRepository', async () => {
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.emailHash, emailHash))
        .limit(1);
      if (!row) return null;
      return { ...toDto(row), passwordHash: row.passwordHash };
    });
  }

  async update(
    id: string,
    data: Partial<{ name: string; isActive: boolean; role: 'user' | 'admin' }>,
    tx?: DbOrTx,
  ): Promise<UserResponseDto> {
    return dbExec('update', 'UsersRepository', async () => {
      const conn = (tx ?? db) as typeof db;
      const payload: Record<string, unknown> = { updatedAt: new Date() };

      if (data.name !== undefined) payload.name = this.enc.encrypt(data.name);
      if (data.isActive !== undefined) payload.isActive = data.isActive;
      if (data.role !== undefined) payload.role = data.role;

      const [row] = await conn
        .update(users)
        .set(payload)
        .where(eq(users.id, id))
        .returning();
      return toDto(row);
    });
  }

  async findAll(
    filters?: FindAllFilters,
  ): Promise<{ data: UserResponseDto[]; total: number }> {
    return dbExec('findAll', 'UsersRepository', async () => {
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const offset = filters?.offset ?? (page - 1) * limit;

      const conditions: ReturnType<typeof eq>[] = [];
      if (filters?.role) conditions.push(eq(users.role, filters.role));
      if (filters?.isActive !== undefined)
        conditions.push(eq(users.isActive, filters.isActive));

      const where = conditions.length ? and(...conditions) : undefined;

      const [data, totals] = await Promise.all([
        db
          .select()
          .from(users)
          .where(where)
          .orderBy(asc(users.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(users).where(where),
      ]);

      return { data: data.map(toDto), total: totals[0].count };
    });
  }
}
