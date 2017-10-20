import Model from '../src/model.js';

describe('Model', () => {
  let model;
  beforeEach(() => {
    model = new Model({ answer: 42, question: '', person: { name: 'Zaphod', heads: 1 } });
    model.firstSpy = jest.fn();
    model.secondSpy = jest.fn();
  });

  describe('constructor', () => {
    it('creates a model', () => {
      const collection = {};
      const storage = {};
      const m = new Model(undefined, { collection, storage });
      expect(m instanceof Model).toBe(true);
      expect(m[Symbol.for('c_collection')]).toBe(collection);
      expect(m[Symbol.for('c_storage')]).toBe(storage);
      expect(m.data).toEqual({});
    });
  });

  describe('data', () => {
    it('emits `change` event when `data` is changed', () => {
      model.on(model, 'change', model.firstSpy);
      model.data.answer = 1;
      expect(model.firstSpy.mock.calls.length).toBe(1);
      expect(model.firstSpy.mock.calls[0][0]).toEqual({
        event: 'change',
        emitter: model,
        path: '',
        previous: 42,
      });
    });

    it('reacts to changes on nested objects', () => {
      model.on(model, 'change', model.firstSpy);
      model.on(model, 'change:person', model.secondSpy);
      model.data.person.name = 'Ford';
      expect(model.firstSpy.mock.calls.length).toBe(1);
      expect(model.secondSpy.mock.calls.length).toBe(1);
      expect(model.secondSpy.mock.calls[0][0]).toEqual({
        event: 'change:person',
        emitter: model,
        path: ':person',
        previous: 'Zaphod',
      });
    });

    it('reacts to changes on nested arrays', () => {
      const spy = jest.fn();
      model.on(model, 'change', model.firstSpy);
      model.on(model, 'change:second:third', model.secondSpy);
      model.on(model, 'change:second:third:0', spy);
      model.data.second = { third: [] };
      model.data.second.third.push(1);
      expect(model.firstSpy.mock.calls.length).toBe(2);
      expect(model.secondSpy.mock.calls.length).toBe(1);
      expect(spy.mock.calls.length).toBe(1);
      expect(spy.mock.calls[0][0]).toEqual({
        event: 'change:second:third:0',
        emitter: model,
        path: ':second:third',
        previous: undefined,
      });
    });

    it('handles cyclic references', () => {
      const ab = { a: 1, b: 2 };
      ab.c = ab;
      model.data.first = ab;
      expect(model.constructor.proxies.get(model.data.first).path).toEqual(':first');
    });

    it('handles moving attributes within model', () => {
      model.on(model, 'change', model.firstSpy);
      model.on(model, 'change:first:name', model.secondSpy);
      model.data.first = model.data.person;
      model.data.person = undefined;
      model.data.first.name = 'Ford';
      expect(model.firstSpy.mock.calls.length).toBe(3);
      expect(model.secondSpy.mock.calls[0][0]).toEqual({
        event: 'change:first:name',
        emitter: model,
        path: ':first',
        previous: 'Zaphod',
      });
    });

    it('reacts to deleting properties', () => {
      model.on(model, 'change', model.firstSpy);
      delete model.data.answer;
      expect(model.firstSpy.mock.calls.length).toBe(1);
      expect(model.firstSpy.mock.calls[0][0]).toEqual({
        event: 'change',
        emitter: model,
        path: '',
        previous: 42,
      });
    });

    it('does not react to deleting non-existing properties', () => {
      model.on(model, 'change', model.firstSpy);
      delete model.data.nonexisting;
      expect(model.firstSpy.mock.calls.length).toBe(0);
    });
  });

  describe('assing', () => {
    it('assigns attributes to the model', () => {
      const attributes = {
        answer: 1,
        planet: 'Earth',
      };
      model.on(model, 'change', model.firstSpy);
      model.assign(attributes);
      expect(model.data).toEqual({
        answer: 1,
        planet: 'Earth',
        question: '',
        person: { name: 'Zaphod', heads: 1 },
      });
      expect(model.firstSpy.mock.calls.length).toBe(2);
    });
  });

  describe('merge', () => {
    it('merges given attributes into the model', () => {
      const attributes = {
        answer: 1,
        planet: 'Earth',
      };
      model.on(model, 'change', model.firstSpy);
      model.merge(attributes);
      expect(model.data).toEqual({
        answer: 1,
        planet: 'Earth',
        question: '',
        person: { name: 'Zaphod', heads: 1 },
      });
      expect(model.firstSpy.mock.calls.length).toBe(2);
    });

    it('merges nested properties', () => {
      model.on(model, 'change', model.firstSpy);
      model.merge({ person: { name: 'Ford' } });
      expect(model.data).toEqual({
        answer: 42,
        question: '',
        person: { name: 'Ford', heads: 1 },
      });
      expect(model.firstSpy.mock.calls.length).toBe(1);
    });

    it('merges nested arrays', () => {
      model.data.first = [1, 2, 3];
      model.on(model, 'change', model.firstSpy);
      const arr = [];
      arr[0] = 4;
      arr[3] = 5;
      model.merge({ first: arr });
      expect(model.data.first).toEqual([4, 2, 3, 5]);
      expect(model.firstSpy.mock.calls.length).toBe(2);
    });
  });

  describe('reset', () => {
    it('resets the model with given attributes', () => {
      model.on(model, 'change', model.firstSpy);
      const attributes = { name: 'Ford' };
      model.reset(attributes);
      expect(model.data).toEqual(attributes);
      expect(model.firstSpy.mock.calls.length).toBe(1);
    });

    it('avoid emitting `change` event if `silent:true`', () => {
      model.on(model, 'change', model.firstSpy);
      model.reset(undefined, { silent: true });
      expect(model.data).toEqual({});
      expect(model.firstSpy.mock.calls.length).toBe(0);
    });
  });

  describe('id', () => {
    it('returns the id of the model', () => {
      model.data._id = 100;
      expect(model.id).toBe(100);
    });
  });

  describe('toJSON', () => {
    it('returns a copy of attributes', () => {
      expect(model.toJSON()).toEqual(model.data);
      expect(model.toJSON()).not.toBe(model.data);
    });
  });

  describe('read', () => {
    beforeEach(() => {
      model.sync = () => Promise.resolve({ answer: 40 });
    });

    it("assigns response to the model's attributes and emits `sync` event", () => {
      model.on(model, 'sync', model.firstSpy);
      return model.read().then((response) => {
        expect(response).toEqual({ answer: 40 });
        expect(model.firstSpy.mock.calls[0][0].event).toBe('sync');
        expect(model.firstSpy.mock.calls[0][0].emitter).toBe(model);
        expect(model.data.answer).toEqual(40);
      });
    });

    it('does not update model if `skip:true`', () => model.read({ skip: true }).then((response) => {
      expect(response).toEqual({ answer: 40 });
      expect(model.data).toEqual({
        answer: 42,
        question: '',
        person: {
          name: 'Zaphod',
          heads: 1,
        },
      });
    }));

    it('resets the model with response if `method:reset`', () => model.read({ method: 'reset' }).then(() => {
      expect(model.data).toEqual({ answer: 40 });
    }));

    it('merges the model with response if `method:merge`', () => {
      model.sync = () => Promise.resolve({ person: { name: 'Ford' } });
      return model.read({ method: 'merge' }).then(() => {
        expect(model.data).toEqual({
          answer: 42,
          question: '',
          person: {
            name: 'Ford',
            heads: 1,
          },
        });
      });
    });

    it('does not fire `sync` event if `silent:true`', () => {
      model.on(model, 'sync', model.firstSpy);
      return model.read({ silent: true }).then(() => {
        expect(model.firstSpy).not.toHaveBeenCalled();
      });
    });

    it('fires `error` event and rejects if an error happens', () => {
      const error = new Error('404');
      model.sync = () => Promise.reject(error);
      model.on(model, 'error', model.firstSpy);
      return model.read().catch((err) => {
        expect(model.firstSpy.mock.calls[0][0].event).toBe('error');
        expect(err).toBe(error);
      });
    });
  });

  describe('write', () => {
    beforeEach(() => {
      model.sync = () => Promise.resolve({ answer: 40 });
    });

    it('saves the model to the storage firing `sync` event', () => {
      model.sync = () => Promise.resolve('');
      model.on(model, 'sync', model.firstSpy);
      return model.write().then(() => {
        expect(model.firstSpy.mock.calls[0][0].event).toBe('sync');
        expect(model.firstSpy.mock.calls[0][0].emitter).toBe(model);
      });
    });

    it('updates the model if the storage returns an object as a response', () => model.write().then(() => {
      expect(model.data).toEqual({ answer: 40, question: '', person: { name: 'Zaphod', heads: 1 } });
    }));

    it('does not update the model if `skip:true`', () => model.write({ skip: true }).then((response) => {
      expect(response).toEqual({ answer: 40 });
      expect(model.data).toEqual({ answer: 42, question: '', person: { name: 'Zaphod', heads: 1 } });
    }));

    it('resets the model with response if `method:reset`', () => model.write({ method: 'reset' }).then(() => {
      expect(model.data).toEqual({ answer: 40 });
    }));

    it('merges the model with response if `method:merge`', () => {
      model.sync = () => Promise.resolve({ person: { name: 'Ford' } });
      return model.write({ method: 'merge' }).then(() => {
        expect(model.data).toEqual({
          answer: 42,
          question: '',
          person: {
            name: 'Ford',
            heads: 1,
          },
        });
      });
    });

    it('does not fire `sync` event if `silent:true`', () => {
      model.on(model, 'sync', model.firstSpy);
      return model.write({ silent: true }).then(() => {
        expect(model.firstSpy).not.toHaveBeenCalled();
      });
    });

    it('fires `error` event and rejects if an error happens', () => {
      const error = new Error('404');
      model.sync = () => Promise.reject(error);
      model.on(model, 'error', model.firstSpy);
      return model.write().catch((err) => {
        expect(model.firstSpy.mock.calls[0][0].event).toBe('error');
        expect(err).toBe(error);
      });
    });
  });

  describe('erase', () => {
    it('removes the model from the storage and disposes the model firing `sync` event', () => {
      model.sync = () => Promise.resolve('');
      model.dispose = jest.fn();
      model.on(model, 'sync', model.firstSpy);
      return model.erase().then(() => {
        expect(model.firstSpy.mock.calls[0][0].event).toBe('sync');
        expect(model.firstSpy.mock.calls[0][0].emitter).toBe(model);
        expect(model.dispose).toHaveBeenCalled();
      });
    });

    it('avoids disposing the model if `keep:true`', () => {
      model.sync = () => Promise.resolve('');
      model.dispose = jest.fn();
      model.on(model, 'sync', model.firstSpy);
      return model.erase({ keep: true }).then(() => {
        expect(model.firstSpy.mock.calls[0][0].event).toBe('sync');
        expect(model.firstSpy.mock.calls[0][0].emitter).toBe(model);
        expect(model.dispose).not.toHaveBeenCalled();
      });
    });

    it('does not fire `sync` event if `silent:true`', () => {
      model.sync = () => Promise.resolve('');
      model.on(model, 'sync', model.firstSpy);
      return model.erase({ silent: true }).then(() => {
        expect(model.firstSpy).not.toHaveBeenCalled();
      });
    });

    it('fires `error` event and rejects if an error happens', () => {
      const error = new Error('404');
      model.sync = () => Promise.reject(error);
      model.on(model, 'error', model.firstSpy);
      return model.erase().catch((err) => {
        expect(model.firstSpy.mock.calls[0][0].event).toBe('error');
        expect(err).toBe(error);
      });
    });
  });

  describe('sync', () => {
    it('calls `sync` method of the storage', () => {
      model[Symbol.for('c_storage')] = {};
      model[Symbol.for('c_storage')].sync = jest.fn();
      model.sync();
      expect(model[Symbol.for('c_storage')].sync).toHaveBeenCalled();
    });

    it('prefers the storage of the collection', () => {
      model[Symbol.for('c_storage')] = {};
      model[Symbol.for('c_storage')].sync = jest.fn();
      model[Symbol.for('c_collection')] = {};
      model[Symbol.for('c_collection')].storage = {};
      model[Symbol.for('c_collection')].storage.sync = jest.fn();
      model.sync();
      expect(model[Symbol.for('c_storage')].sync).not.toHaveBeenCalled();
      expect(model[Symbol.for('c_collection')].storage.sync).toHaveBeenCalled();
    });

    it('rejects if no storage is found', () => model.sync().catch((error) => {
      expect(error.message).toBe('Storage is not defined.');
    }));
  });

  describe('dispose', () => {
    it('prepares the model to be disposed', () => {
      model.on(model, 'dispose', model.firstSpy);
      expect(model[Symbol.for('c_events')]).toBeDefined();
      expect(model[Symbol.for('c_listeners')]).toBeDefined();
      model.dispose();
      expect(model[Symbol.for('c_events')]).toBe(undefined);
      expect(model[Symbol.for('c_listeners')].size).toEqual(0);
    });

    it('fires `dispose` event unless `silent:true`', () => {
      model.on(model, 'dispose', model.firstSpy);
      model.dispose();
      expect(model.firstSpy).toHaveBeenCalled();
      const otherMethod = jest.fn();
      model.on(model, 'dispose', otherMethod);
      model.dispose({ silent: true });
      expect(otherMethod).not.toHaveBeenCalled();
    });
  });
});
