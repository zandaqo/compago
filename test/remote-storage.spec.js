import RemoteStorage from '../lib/remote-storage';

class MockResponse {
  constructor(status, headers, body) {
    this.status = status;
    this.headers = new Map();
    Object.keys(headers).forEach((key) => {
      this.headers.set(key, headers[key]);
    });
    this.body = body;
  }

  get ok() {
    return (this.status >= 200) && (this.status < 300);
  }

  json() {
    return this.body ? Promise.resolve(this.body) : Promise.reject();
  }
}

describe('RemoteStorage', () => {
  let storage;

  beforeEach(() => {
    storage = new RemoteStorage({ url: 'http://example.com/posts' });
  });

  describe('constructor', () => {
    it('creates an ajax storage controller', () => {
      expect(storage.url).toBe('http://example.com/posts');
    });
  });

  describe('isStored', () => {
    it('checks whether a model has been already persisted on the server', () => {
      const model = { id: 100 };
      expect(RemoteStorage.isStored(model)).toBe(true);
      expect(RemoteStorage.isStored({})).toBe(false);
    });
  });

  describe('sync', () => {
    let model;
    let response;

    beforeEach(() => {
      model = { id: 42 };
      model.toJSON = () => model;
      response = new MockResponse(200, { 'content-type': 'application/json' }, {});
      window.fetch = jest.fn(() => Promise.resolve(response));
    });

    afterEach(() => {
      window.fetch.mockRestore();
    });

    it('rejects if an invalid method is used', () => storage.sync().catch((error) => {
      expect(error.message).toBe('Method is not found.');
    }));

    it('reads a model', () => {
      const result = { name: 'Arthur' };
      response.body = result;
      return storage.sync('read', model).then((data) => {
        expect(window.fetch.mock.calls).toEqual([['http://example.com/posts/42', {
          method: 'GET',
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
        }]]);
        expect(data).toEqual(result);
      });
    });

    it('reads all models in a collection', () => {
      const collection = {};
      response.headers.set('content-type', 'text/plain');
      return storage.sync('read', collection).then(() => {
        expect(window.fetch.mock.calls).toEqual([['http://example.com/posts', {
          method: 'GET',
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
        }]]);
      });
    });

    it('creates a model', () => {
      delete model.id;
      model.name = 'Arthur';
      const result = { name: 'Arthur', id: 1 };
      response.body = result;
      return storage.sync('write', model).then((data) => {
        expect(window.fetch.mock.calls).toEqual([['http://example.com/posts', {
          method: 'POST',
          body: JSON.stringify(model),
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
        }]]);
        expect(data).toEqual(result);
      });
    });

    it('updates a model', () => storage.sync('write', model).then(() => {
      expect(window.fetch.mock.calls).toEqual([['http://example.com/posts/42', {
        method: 'PUT',
        body: JSON.stringify(model),
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
      }]]);
    }));

    it('patches a model if `patch:true` and model.changes are present', () => {
      model.changes = { name: 'Arthur' };
      return storage.sync('write', model, { patch: true }).then(() => {
        expect(window.fetch.mock.calls).toEqual([['http://example.com/posts/42', {
          method: 'PATCH',
          body: JSON.stringify(model.changes),
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
        }]]);
      });
    });

    it('deletes a model', () => storage.sync('erase', model).then(() => {
      expect(window.fetch.mock.calls).toEqual([['http://example.com/posts/42', {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
      }]]);
    }));

    it('rejects if server returns an error', () => {
      response.status = 404;
      response.headers.set('content-type', 'text/plain');
      return storage.sync('read', model).catch((error) => {
        expect(window.fetch.mock.calls).toEqual([['http://example.com/posts/42', {
          method: 'GET',
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
        }]]);
        expect(error.message).toBe('404');
      });
    });

    it('fires `request` and `response` events unless `silent:true`', () => {
      storage.someMethod = jest.fn();
      storage.otherMethod = jest.fn();
      storage.addEventListener('request', storage.someMethod);
      storage.addEventListener('response', storage.otherMethod);
      return storage.sync('read', model).then(() => {
        expect(storage.someMethod).toHaveBeenCalled();
        expect(storage.otherMethod).toHaveBeenCalled();
      });
    });

    it('does not fire any events if `silent:true`', () => {
      storage.someMethod = jest.fn();
      storage.otherMethod = jest.fn();
      storage.addEventListener('request', storage.someMethod);
      storage.addEventListener('response', storage.otherMethod);
      return storage.sync('read', model, { silent: true }).then(() => {
        expect(storage.someMethod).not.toHaveBeenCalled();
        expect(storage.otherMethod).not.toHaveBeenCalled();
      });
    });
  });

  describe('dispose', () => {
    it('fires `dispose` event unless `silent:true`', () => {
      storage.someMethod = jest.fn();
      storage.addEventListener('dispose', storage.someMethod);
      storage.dispose();
      expect(storage.someMethod).toHaveBeenCalled();
      const otherMethod = jest.fn();
      storage.addEventListener('dispose', storage.otherMethod);
      storage.dispose({ silent: true });
      expect(otherMethod).not.toHaveBeenCalled();
    });
  });
});
