import type { Result } from "./result.ts";

// deno-lint-ignore no-explicit-any
export type Constructor<T> = { new (...args: any[]): T };

export type Entity<
  T extends { [K in ID]?: unknown },
  ID extends string = "_id",
> =
  & T
  & { [K in ID]: Exclude<T[ID], undefined> };

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
