import { RESTRepository } from '../src/rest-repository';
import { Result } from '../src/result';

describe('RESTRepository', () => {
  let repository: RESTRepository<Object>;

  beforeEach(() => {
    repository = new RESTRepository(Object, '/things');
  });

  describe('constructor', () => {
    it('creates and instant of repository', () => {
      expect(repository instanceof RESTRepository).toBe(true);
    });
  });

  describe('exists', () => {
    it('checks if an entity was persisted', async () => {
      expect(await repository.exists({ _id: 1 })).toEqual({ ok: true, value: true });
      expect(await repository.exists({ _id: null })).toEqual({ ok: true, value: false });
      expect(await repository.exists({ _id: undefined })).toEqual({
        ok: true,
        value: false,
      });
      expect(await repository.exists({ _id: false })).toEqual({ ok: true, value: true });
      const idRepo = new RESTRepository(Object, '', 'id');
      expect(await idRepo.exists({ _id: 1 })).toEqual({ ok: true, value: false });
      expect(await idRepo.exists({ id: 1 })).toEqual({ ok: true, value: true });
    });
  });

  describe('get', () => {
    it('queries REST endpoint with optional search parameters', async () => {
      jest
        .spyOn(RESTRepository, 'fetch')
        .mockReturnValue(Promise.resolve(Result.ok([{}])));
      const result = await repository.get({ a: '1', b: '1' }, '/abc');
      expect(RESTRepository.fetch).toHaveBeenCalledWith('/things/abc?a=1&b=1');
      expect(result.ok).toBe(true);
      expect(result.value).toEqual([{}]);
      (RESTRepository.fetch as jest.Mock).mockRestore();
    });
    it('queries an endpoint without search parameters', async () => {
      jest
        .spyOn(RESTRepository, 'fetch')
        .mockReturnValue(Promise.resolve(Result.ok([{}])));
      await repository.get();
      expect(RESTRepository.fetch).toHaveBeenCalledWith('/things');
      (RESTRepository.fetch as jest.Mock).mockRestore();
    });
    it('proxies failed response when fetch fails', async () => {
      const error = new TypeError();
      jest
        .spyOn(RESTRepository, 'fetch')
        .mockReturnValue(Promise.resolve(Result.fail(error)));
      const result = await repository.get();
      expect(RESTRepository.fetch).toHaveBeenCalledWith('/things');
      expect(result.ok).toBe(false);
      expect(result.value).toBe(error);
      (RESTRepository.fetch as jest.Mock).mockRestore();
    });
  });

  describe('read', () => {
    it('fetches entity from endpoint by id', async () => {
      const entity = { _id: 'a' };
      jest
        .spyOn(RESTRepository, 'fetch')
        .mockReturnValue(Promise.resolve(Result.ok(entity)));
      const result = await repository.read('a');
      expect(RESTRepository.fetch).toHaveBeenCalledWith('/things/a');
      expect(result.ok).toBe(true);
      expect(result.value).toEqual(entity);
      (RESTRepository.fetch as jest.Mock).mockRestore();
    });
    it('proxies failed response when fetch fails', async () => {
      const error = new TypeError();
      jest
        .spyOn(RESTRepository, 'fetch')
        .mockReturnValue(Promise.resolve(Result.fail(error)));
      const result = await repository.read('a');
      expect(RESTRepository.fetch).toHaveBeenCalledWith('/things/a');
      expect(result.ok).toBe(false);
      expect(result.value).toBe(error);
      (RESTRepository.fetch as jest.Mock).mockRestore();
    });
  });

  describe('save', () => {
    it('persists a new entity if it does not exist', async () => {
      const request = { a: 1 };
      jest
        .spyOn(RESTRepository, 'fetch')
        .mockReturnValue(Promise.resolve(Result.ok(undefined)));
      await repository.save(request);
      expect(RESTRepository.fetch).toHaveBeenCalledWith('/things', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      (RESTRepository.fetch as jest.Mock).mockRestore();
    });
    it('updates an existing entity', async () => {
      const request = { _id: 'a', a: 1 };
      jest
        .spyOn(RESTRepository, 'fetch')
        .mockReturnValue(Promise.resolve(Result.ok(undefined)));
      await repository.save(request);
      expect(RESTRepository.fetch).toHaveBeenCalledWith('/things/a', {
        method: 'PUT',
        body: JSON.stringify(request),
      });
      (RESTRepository.fetch as jest.Mock).mockRestore();
    });
  });

  describe('delete', () => {
    it('removes an existing entity', async () => {
      jest
        .spyOn(RESTRepository, 'fetch')
        .mockReturnValue(Promise.resolve(Result.ok(undefined)));
      await repository.delete('a');
      expect(RESTRepository.fetch).toHaveBeenCalledWith('/things/a', {
        method: 'DELETE',
      });
      (RESTRepository.fetch as jest.Mock).mockRestore();
    });
    xit('returns if the entity has not been persisted', async () => {
      const request = { a: 1 };
      jest
        .spyOn(RESTRepository, 'fetch')
        .mockReturnValue(Promise.resolve(Result.ok(undefined)));
      await repository.delete(request.a.toString());
      expect(RESTRepository.fetch).not.toHaveBeenCalled();
      (RESTRepository.fetch as jest.Mock).mockRestore();
    });
  });

  describe('fetch', () => {
    let response: any;
    let nativeFetch: typeof globalThis.fetch;

    beforeEach(() => {
      nativeFetch = globalThis.fetch;
      (globalThis.fetch as any) = jest.fn(() => Promise.resolve(response));
    });

    afterEach(() => {
      globalThis.fetch = nativeFetch;
    });

    it('calls Fetch API supplying default headers', async () => {
      response = {
        ok: true,
        status: 204,
        headers: new Map([]),
      };
      const result = await RESTRepository.fetch('');
      expect(result.ok).toBe(true);
      expect(result.value).toBeUndefined();
      expect(globalThis.fetch).toHaveBeenCalledWith('', RESTRepository.init);
    });

    it('handles redirected response', async () => {
      response = {
        ok: false,
        status: 304,
        headers: new Map([]),
      };
      const result = await RESTRepository.fetch('');
      expect(result.ok).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('handles json response', async () => {
      response = {
        ok: true,
        status: 200,
        headers: new Map([['Content-Type', 'application/json']]),
        json: () => Promise.resolve({ a: 1 }),
      };
      const result = await RESTRepository.fetch('');
      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ a: 1 });
    });

    it('returns Fetch API response if request fails', async () => {
      response = {
        ok: false,
        status: 404,
        headers: new Map([['Content-Type', 'application/json']]),
      };
      const result = await RESTRepository.fetch('');
      expect(result.ok).toBe(false);
      expect(result.value).toEqual(response);
    });

    it('returns error if Fetch API promise fails', async () => {
      globalThis.fetch = jest.fn(() => Promise.reject('error'));
      const result = await RESTRepository.fetch('');
      expect(result.ok).toBe(false);
      expect(result.value).toEqual('error');
    });
  });
});
