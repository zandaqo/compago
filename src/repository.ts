import type { Result } from './result';

export interface Repository<T extends Object> {
  exists(value: T): Promise<Result<boolean, unknown>>;
  get(...args: Array<unknown>): Promise<Result<Array<T>, unknown>>;
  create(value: T): Promise<Result<unknown, unknown>>;
  read(id: unknown): Promise<Result<T, unknown>>;
  update(...args: Array<unknown>): Promise<Result<unknown, unknown>>;
  delete(id: unknown): Promise<Result<unknown, unknown>>;
  serialize(entity: T): unknown;
  deserialize(value: unknown): T;
}
