import { Result } from './result';

export interface IRepository<T extends Object> {
  exists(value: T): Promise<boolean>;
  get(...args: any[]): Promise<Result<any>>;
  read(id: any): Promise<Result<any>>;
  delete(id: any): Promise<Result<any>>;
  serialize(entity: T): any;
  deserialize(value: any): T;
}
