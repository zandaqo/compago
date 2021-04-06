import type { Repository } from './repository';
import { Result } from './result';

export class RESTRepository<T extends Object> implements Repository<T> {
  static init: Partial<RequestInit> = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  };

  constructor(
    private EntityClass: { new (...args: any[]): T },
    private url: string,
    private idProperty = '_id',
  ) {}

  exists(value: T): Promise<Result<boolean, undefined>> {
    return Promise.resolve(Result.ok((value as any)[this.idProperty] != null));
  }

  async query<U>(
    search?: Record<string, string>,
    path = '',
  ): Promise<Result<U, undefined | Response | TypeError>> {
    let { url } = this;
    if (path) url += path;
    if (search) url += `?${new globalThis.URLSearchParams(search).toString()}`;
    const result = await RESTRepository.fetch<U>(url);
    if (!result.ok) return result;
    if (result.value === undefined) return Result.fail(undefined);
    return result as Result<U, undefined>;
  }

  async command<U>(
    body: unknown,
    path = '',
  ): Promise<Result<U | undefined, Response | TypeError>> {
    let { url } = this;
    if (path) url += path;
    return await RESTRepository.fetch<U>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async get(
    search?: Record<string, string>,
  ): Promise<Result<Array<T>, undefined | Response | TypeError>> {
    const result = await this.query<Array<any>>(search);
    if (!result.ok) return result;
    return Result.ok(result.value.map((i) => this.deserialize(i)));
  }

  create(value: T) {
    return this.save(value);
  }

  async read(id: string): Promise<Result<T, Response | TypeError>> {
    const result = await RESTRepository.fetch(`${this.url}/${id}`);
    if (!result.ok) return result;
    return Result.ok(this.deserialize(result.value));
  }

  update(_: any, updates: any) {
    return this.save(updates);
  }

  async delete(id: string) {
    return RESTRepository.fetch(`${this.url}/${id}`, {
      method: 'DELETE',
    });
  }

  serialize(entity: T): string {
    return JSON.stringify(entity);
  }

  deserialize(value: any): T {
    return new this.EntityClass(value);
  }

  async save(value: T) {
    let { url } = this;
    let method = 'POST';
    const exists = await this.exists(value);
    if (exists.value) {
      method = 'PUT';
      url += `/${(value as any)[this.idProperty]}`;
    }
    return RESTRepository.fetch(url, {
      method,
      body: this.serialize(value),
    });
  }

  static async fetch<T>(
    url: string,
    init: Partial<RequestInit> = {},
  ): Promise<Result<T | undefined, Response | TypeError>> {
    try {
      const response = await globalThis.fetch(url, { ...this.init, ...init });
      if (response.ok || response.status === 304) {
        const contentType = response.headers.get('Content-Type');
        if (!contentType || contentType.indexOf('application/json') === -1)
          return Result.ok(undefined);
        const body = await response.json();
        return Result.ok(body);
      } else {
        return Result.fail(response);
      }
    } catch (e) {
      return Result.fail(e);
    }
  }
}
