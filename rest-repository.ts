import type { Constructor } from "./constructor.ts";
import type { Repository } from "./repository.ts";
import { Result } from "./result.ts";

/**
 * RESTRepository encapsulates the logic required to access data sources
 * exposed as RESTful APIs.
 */
export class RESTRepository<T extends object> implements Repository<T> {
  static init: Partial<RequestInit> = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  constructor(
    public Entity: Constructor<T>,
    public url: string,
    public idProperty: string = "_id",
  ) {}

  exists(value: T): Promise<Result<boolean, undefined>> {
    return Promise.resolve(
      Result.ok(value[this.idProperty as keyof T] != null),
    );
  }

  async query<U>(
    search?: Record<string, string>,
    path = "",
  ): Promise<Result<U | undefined, Response | TypeError>> {
    let { url } = this;
    if (path) url += path;
    if (search) url += `?${new URLSearchParams(search).toString()}`;
    return await (this.constructor as typeof RESTRepository).fetch<U>(url);
  }

  async command<U>(
    body: unknown,
    path = "",
  ): Promise<Result<U | undefined, Response | TypeError>> {
    let { url } = this;
    if (path) url += path;
    return await (this.constructor as typeof RESTRepository).fetch<U>(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async list(
    search?: Record<string, string>,
  ): Promise<Result<Array<T>, undefined | Response | TypeError>> {
    const result = await this.query<Array<string>>(search);
    if (!result.ok) return result;
    if (result.value === undefined) return Result.fail(undefined);
    return Result.ok(result.value.map((i) => this.deserialize(i)));
  }

  create(value: T): Promise<Result<unknown, Response | TypeError>> {
    return (this.constructor as typeof RESTRepository).fetch(
      `${this.url}`,
      { method: "POST", body: this.serialize(value) as string },
    );
  }

  async read(id: string): Promise<Result<T, Response | TypeError>> {
    const result = await (this.constructor as typeof RESTRepository).fetch(
      `${this.url}/${id}`,
    );
    if (!result.ok) return result;
    return Result.ok(this.deserialize(result.value));
  }

  update(
    id: string,
    updates: Partial<T>,
  ): Promise<Result<unknown, Response | TypeError>> {
    return (this.constructor as typeof RESTRepository).fetch<unknown>(
      `${this.url}/${id}`,
      { method: "PUT", body: this.serialize(updates) as string },
    );
  }

  delete(id: string): Promise<Result<undefined, Response | TypeError>> {
    return (this.constructor as typeof RESTRepository).fetch<undefined>(
      `${this.url}/${id}`,
      { method: "DELETE" },
    );
  }

  serialize(entity: Partial<T>): unknown {
    return JSON.stringify(entity);
  }

  deserialize(value: unknown): T {
    return new this.Entity(value);
  }

  async save(value: T): Promise<Result<unknown, Response | TypeError>> {
    const exists = await this.exists(value);
    if (exists.value) {
      return this.update(
        value[this.idProperty as keyof T] as unknown as string,
        value,
      );
    }
    return this.create(value);
  }

  static async fetch<T>(
    url: string,
    init: Partial<RequestInit> = {},
  ): Promise<Result<T | undefined, Response | TypeError>> {
    try {
      const response = await globalThis.fetch(url, { ...this.init, ...init });
      if (response.ok || response.status === 304) {
        const contentType = response.headers.get("Content-Type");
        if (contentType) {
          const body: T = contentType.includes("application/json")
            ? await response.json()
            : await response.arrayBuffer();
          return Result.ok(body);
        }
        return Result.ok(undefined);
      } else {
        return Result.fail(response);
      }
    } catch (e) {
      return Result.fail(e);
    }
  }
}
