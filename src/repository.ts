import { Result } from './result';

export interface Repository<T extends Object> {
  exists(value: T): Promise<Result<boolean, any>>;
  get(...args: Array<any>): Promise<Result<Array<T>, any>>;
  create(value: T): Promise<Result<any, any>>;
  read(id: any): Promise<Result<T, any>>;
  update(...args: Array<any>): Promise<Result<any, any>>;
  delete(id: any): Promise<Result<any, any>>;
  serialize(entity: T): any;
  deserialize(value: any): T;
}
