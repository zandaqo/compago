import type { Repository } from "./repository.ts";
import { Result } from "./result.ts";

// deno-lint-ignore ban-types
export class RESTRepository<T extends object> implements Repository<T> {
  static init: Partial<RequestInit> = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  constructor(
    protected EntityClass: { new (...args: unknown[]): T },
    protected url: string,
    protected idProperty = "_id",
  ) {}

  exists(value: T): Promise<Result<boolean, undefined>> {
    return Promise.resolve(
      Result.ok(value[this.idProperty as keyof T] != null),
    );
  }

  async query<U>(
    search?: Record<string, string>,
    path = "",
  ): Promise<Result<U, undefined | Response | TypeError>> {
    let { url } = this;
    const constructor = this.constructor as typeof RESTRepository;
    if (path) url += path;
    if (search) url += `?${new URLSearchParams(search).toString()}`;
    const result = await constructor.fetch<U>(url);
    if (!result.ok) return result;
    if (result.value === undefined) return Result.fail(undefined);
    return result as Result<U, undefined>;
  }

  async command<U>(
    body: unknown,
    path = "",
  ): Promise<Result<U | undefined, Response | TypeError>> {
    let { url } = this;
    const constructor = this.constructor as typeof RESTRepository;
    if (path) url += path;
    return await constructor.fetch<U>(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async get(
    search?: Record<string, string>,
  ): Promise<Result<Array<T>, undefined | Response | TypeError>> {
    const result = await this.query<Array<T>>(search);
    if (!result.ok) return result;
    return Result.ok(this.deserializeMany(result.value));
  }

  create(value: T) {
    return this.save(value);
  }

  async read(id: string): Promise<Result<T, Response | TypeError>> {
    const constructor = this.constructor as typeof RESTRepository;
    const result = await constructor.fetch(`${this.url}/${id}`);
    if (!result.ok) return result;
    return Result.ok(this.deserialize(result.value));
  }

  update(_: unknown, updates: unknown) {
    return this.save(updates as T);
  }

  delete(id: string) {
    const constructor = this.constructor as typeof RESTRepository;
    return constructor.fetch(`${this.url}/${id}`, {
      method: "DELETE",
    });
  }

  serialize(entity: T): unknown {
    return JSON.stringify(entity);
  }

  deserialize(value: unknown): T {
    return new this.EntityClass(value);
  }

  deserializeMany(value: unknown): Array<T> {
    return (value as Array<unknown>).map((i) => this.deserialize(i));
  }

  async save(value: T) {
    let { url } = this;
    const constructor = this.constructor as typeof RESTRepository;
    let method = "POST";
    const exists = await this.exists(value);
    if (exists.value) {
      method = "PUT";
      url += `/${value[this.idProperty as keyof T]}`;
    }
    return constructor.fetch(url, {
      method,
      body: this.serialize(value) as string,
    });
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
