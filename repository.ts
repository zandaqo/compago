import type { Result } from "./result.ts";

/**
 * Enforces id attribute on a type. Id attribute name can be specified
 * as the second type argument, uses `_id` by default.
 */
export type Entity<
  T extends { [K in ID]?: unknown },
  ID extends string = "_id",
> =
  & T
  & { [K in ID]: Exclude<T[ID], undefined> };

/**
 * General interface for Repositories.
 */
export interface Repository<T extends object> {
  has(id: unknown): Promise<Result<boolean, unknown>>;
  list(...args: Array<unknown>): Promise<Result<Array<T>, unknown>>;
  create(value: T): Promise<Result<unknown, unknown>>;
  read(id: unknown): Promise<Result<T, unknown>>;
  update(...args: Array<unknown>): Promise<Result<unknown, unknown>>;
  delete(id: unknown): Promise<Result<unknown, unknown>>;
}
