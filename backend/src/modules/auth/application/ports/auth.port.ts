export abstract class AuthRepository {
  abstract findAll(): Promise<unknown[]>;
  abstract findById(id: string): Promise<unknown>;
  abstract create(data: unknown): Promise<unknown>;
  abstract update(id: string, data: unknown): Promise<unknown>;
  abstract delete(id: string): Promise<void>;
}
