export class Result<T> {
  constructor(public ok?: boolean, public value?: T) {}
  static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, value);
  }
  static fail<U>(error: any): Result<U> {
    return new Result<U>(false, error);
  }
}
