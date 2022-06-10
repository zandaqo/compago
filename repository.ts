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
 * The general interface of Repositories.
 */
export interface Repository<T extends object> {
  /**
   * Checks if object exists in the repository.
   *
   * @param id id of the object
   */
  has(id: unknown): Promise<Result<boolean, unknown>>;

  /**
   * Retrieves multiple objects from the repository.
   *
   * @param args search parameters
   */
  list(...args: Array<unknown>): Promise<Result<Array<T>, unknown>>;

  /**
   * Adds a new object to the repository.
   *
   * @param value the object to be added
   */
  create(value: T): Promise<Result<unknown, unknown>>;

  /**
   * Gets a single object from the repository.
   *
   * @param id id of the object
   */
  read(id: unknown): Promise<Result<T, unknown>>;

  /**
   * Updates an object stored in the repository.
   *
   * @param args update parameters
   */
  update(...args: Array<unknown>): Promise<Result<unknown, unknown>>;

  /**
   * Removes an object from the repository.
   *
   * @param id id of the object
   */
  delete(id: unknown): Promise<Result<unknown, unknown>>;
}
