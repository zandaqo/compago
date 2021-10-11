import type { Result } from "./result.ts";

// deno-lint-ignore ban-types
export interface Repository<T extends object> {
  exists(value: T): Promise<Result<boolean, unknown>>;
  list(...args: Array<unknown>): Promise<Result<Array<T>, unknown>>;
  create(value: T): Promise<Result<unknown, unknown>>;
  read(id: unknown): Promise<Result<T, unknown>>;
  update(...args: Array<unknown>): Promise<Result<unknown, unknown>>;
  delete(id: unknown): Promise<Result<unknown, unknown>>;
  serialize(entity: T): unknown;
  deserialize(value: unknown): T;
}
