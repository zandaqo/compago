import { IRepository } from './repository';
import { Result } from './result';

export class RESTRepository<T extends Object> implements IRepository<T> {
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
    private idProperty: string = '_id',
  ) {}

  exists(value: T): Promise<boolean> {
    return Promise.resolve((value as any)[this.idProperty] != null);
  }

  async get(search?: Record<string, string>, path: string = ''): Promise<Result<any>> {
    let { url } = this;
    if (path) url += path;
    if (search) url += `?${new globalThis.URLSearchParams(search).toString()}`;
    const result = await (this.constructor as typeof RESTRepository).fetch(url);
    if (!result.ok) return result;
    const value = (result.value as any[]).map((i) => this.deserialize(i));
    return Result.ok(value);
  }

  create(value: T): Promise<Result<any>> {
    return this.save(value);
  }

  async read(id: string): Promise<Result<any>> {
    const result = await (this.constructor as typeof RESTRepository).fetch(
      `${this.url}/${id}`,
    );
    if (!result.ok) return result;
    return Result.ok(this.deserialize(result.value));
  }

  update(_: any, updates: any): Promise<Result<any>> {
    return this.save(updates);
  }

  async delete(id: string): Promise<Result<any>> {
    return (this.constructor as typeof RESTRepository).fetch(`${this.url}/${id}`, {
      method: 'DELETE',
    });
  }

  serialize(entity: T): string {
    return JSON.stringify(entity);
  }

  deserialize(value: any): T {
    return new this.EntityClass(value);
  }

  async save(value: T): Promise<Result<any>> {
    let { url } = this;
    let method = 'POST';
    const exists = await this.exists(value);
    if (exists) {
      method = 'PUT';
      url += `/${(value as any)[this.idProperty]}`;
    }
    return (this.constructor as typeof RESTRepository).fetch(url, {
      method,
      body: this.serialize(value),
    });
  }

  static async fetch(url: string, init: Partial<RequestInit> = {}): Promise<Result<any>> {
    try {
      const response = await globalThis.fetch(url, { ...this.init, ...init });
      if (response.ok || response.status === 304) {
        const contentType = response.headers.get('Content-Type');
        if (!contentType || contentType.indexOf('application/json') === -1)
          return Result.ok();
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
