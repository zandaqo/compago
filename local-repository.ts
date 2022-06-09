import { Repository } from "./repository.ts";
import { Result } from "./result.ts";

export class LocalRepository<T extends object> implements Repository<T> {
  constructor(
    public db: IDBDatabase,
    public store: string,
    public key: keyof T,
  ) {
  }

  async has(key: string): Promise<Result<boolean, DOMException | null>> {
    if (!key) return Result.ok(false);
    const request = await LocalRepository.promisify(
      this.db.transaction(this.store, "readonly")
        .objectStore(this.store)
        .openCursor(key),
    );
    if (!request.ok) return request;
    return Result.ok(!!request.value);
  }

  async list(
    ...args: Array<string | IDBKeyRange>
  ): Promise<Result<Array<T>, unknown>> {
    const list: Array<T> = [];
    for (const key of args) {
      const result = await LocalRepository.promisify(
        this.db.transaction(this.store, "readonly")
          .objectStore(this.store)
          .getAll(key),
      );
      if (result.ok && result.value) list.push(...result.value);
    }
    return Result.ok(list);
  }

  async create(value: T) {
    return await LocalRepository.promisify(
      this.db.transaction(this.store, "readwrite")
        .objectStore(this.store)
        .add(value),
    );
  }

  async read(id: string): Promise<Result<T, DOMException | null | undefined>> {
    const request = await LocalRepository.promisify(
      this.db.transaction(this.store, "readonly")
        .objectStore(this.store)
        .get(id),
    );
    if (!request.ok) return request;
    if (!request.value) return Result.fail(undefined);
    return request;
  }

  async update(_id: string, updates: Partial<T>) {
    return await LocalRepository.promisify(
      this.db.transaction(this.store, "readwrite")
        .objectStore(this.store)
        .put(updates),
    );
  }

  async delete(id: string) {
    return await LocalRepository.promisify(
      this.db.transaction(this.store, "readwrite")
        .objectStore(this.store)
        .delete(id),
    );
  }

  static promisify<T>(
    request: IDBRequest<T>,
  ): Promise<Result<T, DOMException | null>> {
    return new Promise<Result<T, DOMException | null>>((resolve) => {
      const unlisten = () => {
        request.removeEventListener("success", success);
        request.removeEventListener("error", error);
      };
      const success = () => {
        resolve(Result.ok(request.result));
        unlisten();
      };
      const error = () => {
        resolve(Result.fail(request.error));
        unlisten();
      };
      request.addEventListener("success", success);
      request.addEventListener("error", error);
    });
  }
}
