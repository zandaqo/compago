import Model from '../src/model.js';

EventTarget.prototype._document = document;

describe('Model', () => {
  let model;
  let firstSpy;
  let secondSpy;

  beforeEach(() => {
    model = new Model({ answer: 42, question: '', person: { name: 'Zaphod', heads: 1 } });
    firstSpy = jest.fn();
    secondSpy = jest.fn();
  });

  describe('constructor', () => {
    it('creates a model', () => {
      const collection = {};
      const storage = {};
      const m = new Model(undefined, { collection, storage });
      expect(m instanceof Model).toBe(true);
      expect(m[Symbol.for('c_collection')]).toBe(collection);
      expect(m[Symbol.for('c_storage')]).toBe(storage);
      expect(m.toJSON()).toEqual({});
    });
  });

  describe('data', () => {
    it('emits `change` event when `data` is changed', () => {
      model.addEventListener('change', firstSpy);
      model.answer = 1;
      expect(firstSpy.mock.calls.length).toBe(1);
      expect(firstSpy.mock.calls[0][0].type).toEqual('change');
      expect(firstSpy.mock.calls[0][0].detail).toEqual({
        emitter: model,
        path: '',
        previous: 42,
      });
    });

    it('reacts to changes on nested objects', () => {
      model.addEventListener('change', firstSpy);
      model.addEventListener('change:person', secondSpy);
      model.person.name = 'Ford';
      expect(firstSpy.mock.calls.length).toBe(1);
      expect(secondSpy.mock.calls.length).toBe(1);
      expect(secondSpy.mock.calls[0][0].type).toEqual('change:person');
      expect(secondSpy.mock.calls[0][0].detail).toEqual({
        emitter: model,
        path: ':person',
        previous: 'Zaphod',
      });
    });

    it('reacts to changes on nested arrays', () => {
      const spy = jest.fn();
      model.addEventListener('change', firstSpy);
      model.addEventListener('change:second:third', secondSpy);
      model.addEventListener('change:second:third:0', spy);
      model.second = { third: [] };
      model.second.third.push(1);
      expect(firstSpy.mock.calls.length).toBe(2);
      expect(secondSpy.mock.calls.length).toBe(1);
      expect(spy.mock.calls.length).toBe(1);
      expect(spy.mock.calls[0][0].type).toEqual('change:second:third:0');
      expect(spy.mock.calls[0][0].detail).toEqual({
        emitter: model,
        path: ':second:third',
        previous: undefined,
      });
    });

    it('handles cyclic references', () => {
      const ab = { a: 1, b: 2 };
      ab.c = ab;
      model.first = ab;
      expect(model.constructor.proxies.get(model.first).path).toEqual(':first');
    });

    it('handles moving attributes within model', () => {
      model.addEventListener('change', firstSpy);
      model.addEventListener('change:first:name', secondSpy);
      model.first = model.person;
      model.person = undefined;
      model.first.name = 'Ford';
      expect(firstSpy.mock.calls.length).toBe(3);
      expect(secondSpy.mock.calls[0][0].type).toEqual('change:first:name');
      expect(secondSpy.mock.calls[0][0].detail).toEqual({
        emitter: model,
        path: ':first',
        previous: 'Zaphod',
      });
    });

    it('reacts to deleting properties', () => {
      model.addEventListener('change', firstSpy);
      delete model.answer;
      expect(firstSpy.mock.calls.length).toBe(1);
      expect(firstSpy.mock.calls[0][0].type).toEqual('change');
      expect(firstSpy.mock.calls[0][0].detail).toEqual({
        emitter: model,
        path: '',
        previous: 42,
      });
    });

    it('does not react to deleting non-existing properties', () => {
      model.addEventListener('change', firstSpy);
      delete model.nonexisting;
      expect(firstSpy.mock.calls.length).toBe(0);
    });

    it('does not react to deleting properties set up with symbols', () => {
      model.addEventListener('change', firstSpy);
      delete model[Symbol.for('c_collection')];
      expect(firstSpy.mock.calls.length).toBe(0);
    });
  });

  describe('set', () => {
    it('sets the model with given attributes', () => {
      const spy = jest.fn();
      model.addEventListener('change', spy);
      const attributes = { name: 'Ford' };
      model.set(attributes);
      expect(model.toJSON()).toEqual(attributes);
      expect(spy.mock.calls.length).toBe(4);
    });
  });

  describe('assing', () => {
    it('assigns attributes to the model', () => {
      const attributes = {
        answer: 1,
        planet: 'Earth',
      };
      model.addEventListener('change', firstSpy);
      model.assign(attributes);
      expect(model.toJSON()).toEqual({
        answer: 1,
        planet: 'Earth',
        question: '',
        person: { name: 'Zaphod', heads: 1 },
      });
      expect(firstSpy.mock.calls.length).toBe(2);
    });
  });

  describe('merge', () => {
    it('merges given attributes into the model', () => {
      const attributes = {
        answer: 1,
        planet: 'Earth',
      };
      model.addEventListener('change', firstSpy);
      model.merge(attributes);
      expect(model.toJSON()).toEqual({
        answer: 1,
        planet: 'Earth',
        question: '',
        person: { name: 'Zaphod', heads: 1 },
      });
      expect(firstSpy.mock.calls.length).toBe(2);
    });

    it('merges nested properties', () => {
      model.addEventListener('change', firstSpy);
      model.merge({ person: { name: 'Ford' } });
      expect(model.toJSON()).toEqual({
        answer: 42,
        question: '',
        person: { name: 'Ford', heads: 1 },
      });
      expect(firstSpy.mock.calls.length).toBe(1);
    });

    it('merges nested arrays', () => {
      model.first = [1, 2, 3];
      model.addEventListener('change', firstSpy);
      const arr = [];
      arr[0] = 4;
      arr[3] = 5;
      model.merge({ first: arr });
      expect(model.first).toEqual([4, 2, 3, 5]);
      expect(firstSpy.mock.calls.length).toBe(2);
    });
  });

  describe('id', () => {
    it('returns the id of the model', () => {
      model._id = 100;
      expect(model.id).toBe(100);
    });
  });

  describe('toJSON', () => {
    it('returns a copy of attributes', () => {
      const anotherModel = new Model({ a: 1, b: 2 });
      expect(anotherModel.toJSON()).toEqual({ a: 1, b: 2 });
      expect(anotherModel.toJSON()).not.toBe(anotherModel);
    });
  });

  describe('read', () => {
    beforeEach(() => {
      Object.defineProperty(model, 'sync', {
        value: () => Promise.resolve({ answer: 40 }),
        enumerable: false,
        configurable: true,
      });
    });

    it("assigns response to the model's attributes and emits `sync` event", () => {
      model.addEventListener('sync', firstSpy);
      return model.read().then((response) => {
        expect(response).toEqual({ answer: 40 });
        expect(firstSpy.mock.calls[0][0].type).toBe('sync');
        expect(firstSpy.mock.calls[0][0].detail.emitter).toBe(model);
        expect(model.answer).toEqual(40);
      });
    });

    it('does not update model if `skip:true`', () => model.read({ skip: true }).then((response) => {
      expect(response).toEqual({ answer: 40 });
      expect(model.toJSON()).toEqual({
        answer: 42,
        question: '',
        person: {
          name: 'Zaphod',
          heads: 1,
        },
      });
    }));

    it('resets the model with response if `method:set`', () => model.read({ method: 'set' }).then(() => {
      expect(model.toJSON()).toEqual({ answer: 40 });
    }));

    it('merges the model with response if `method:merge`', () => {
      Object.defineProperty(model, 'sync', {
        value: () => Promise.resolve({ person: { name: 'Ford' } }),
        enumerable: false,
        configurable: true,
      });
      return model.read({ method: 'merge' }).then(() => {
        expect(model.toJSON()).toEqual({
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
      model.addEventListener('sync', firstSpy);
      return model.read({ silent: true }).then(() => {
        expect(firstSpy).not.toHaveBeenCalled();
      });
    });

    it('fires `error` event and rejects if an error happens', () => {
      const error = new Error('404');
      model.sync = () => Promise.reject(error);
      model.addEventListener('error', firstSpy);
      return model.read().catch((err) => {
        expect(firstSpy.mock.calls[0][0].type).toBe('error');
        expect(err).toBe(error);
      });
    });
  });

  describe('write', () => {
    beforeEach(() => {
      Object.defineProperty(model, 'sync', {
        value: () => Promise.resolve({ answer: 40 }),
        enumerable: false,
        configurable: true,
      });
    });

    it('saves the model to the storage firing `sync` event', () => {
      Object.defineProperty(model, 'sync', {
        value: () => Promise.resolve(''),
        enumerable: false,
        configurable: true,
      });
      model.addEventListener('sync', firstSpy);
      return model.write().then(() => {
        expect(firstSpy.mock.calls[0][0].type).toBe('sync');
        expect(firstSpy.mock.calls[0][0].detail.emitter).toBe(model);
      });
    });

    it('updates the model if the storage returns an object as a response', () => model.write().then(() => {
      expect(model.toJSON()).toEqual({ answer: 40, question: '', person: { name: 'Zaphod', heads: 1 } });
    }));

    it('does not update the model if `skip:true`', () => model.write({ skip: true }).then((response) => {
      expect(response).toEqual({ answer: 40 });
      expect(model.toJSON()).toEqual({ answer: 42, question: '', person: { name: 'Zaphod', heads: 1 } });
    }));

    it('resets the model with response if `method:set`', () => model.write({ method: 'set' }).then(() => {
      expect(model.toJSON()).toEqual({ answer: 40 });
    }));

    it('merges the model with response if `method:merge`', () => {
      Object.defineProperty(model, 'sync', {
        value: () => Promise.resolve({ person: { name: 'Ford' } }),
        enumerable: false,
        configurable: true,
      });
      return model.write({ method: 'merge' }).then(() => {
        expect(model.toJSON()).toEqual({
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
      model.addEventListener('sync', firstSpy);
      return model.write({ silent: true }).then(() => {
        expect(firstSpy).not.toHaveBeenCalled();
      });
    });

    it('fires `error` event and rejects if an error happens', () => {
      const error = new Error('404');
      Object.defineProperty(model, 'sync', {
        value: () => Promise.reject(error),
        enumerable: false,
        configurable: true,
      });
      model.addEventListener('error', firstSpy);
      return model.write().catch((err) => {
        expect(firstSpy.mock.calls[0][0].type).toBe('error');
        expect(err).toBe(error);
      });
    });
  });

  describe('erase', () => {
    it('removes the model from the storage and disposes the model firing `sync` event', () => {
      Object.defineProperty(model, 'sync', {
        value: () => Promise.resolve(''),
        enumerable: false,
        configurable: true,
      });
      model.dispose = jest.fn();
      model.addEventListener('sync', firstSpy);
      return model.erase().then(() => {
        expect(firstSpy.mock.calls[0][0].type).toBe('sync');
        expect(firstSpy.mock.calls[0][0].detail.emitter).toBe(model);
        expect(model.dispose).toHaveBeenCalled();
      });
    });

    it('avoids disposing the model if `keep:true`', () => {
      Object.defineProperty(model, 'sync', {
        value: () => Promise.resolve(''),
        enumerable: false,
        configurable: true,
      });
      model.dispose = jest.fn();
      model.addEventListener('sync', firstSpy);
      return model.erase({ keep: true }).then(() => {
        expect(firstSpy.mock.calls[0][0].type).toBe('sync');
        expect(firstSpy.mock.calls[0][0].detail.emitter).toBe(model);
        expect(model.dispose).not.toHaveBeenCalled();
      });
    });

    it('does not fire `sync` event if `silent:true`', () => {
      Object.defineProperty(model, 'sync', {
        value: () => Promise.resolve(''),
        enumerable: false,
        configurable: true,
      });
      model.addEventListener('sync', firstSpy);
      return model.erase({ silent: true }).then(() => {
        expect(firstSpy).not.toHaveBeenCalled();
      });
    });

    it('fires `error` event and rejects if an error happens', () => {
      const error = new Error('404');
      Object.defineProperty(model, 'sync', {
        value: () => Promise.reject(error),
        enumerable: false,
        configurable: true,
      });
      model.addEventListener('error', firstSpy);
      return model.erase().catch((err) => {
        expect(firstSpy.mock.calls[0][0].type).toBe('error');
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
    it('fires `dispose` event unless `silent:true`', () => {
      model.addEventListener('dispose', firstSpy);
      model.dispose();
      expect(firstSpy).toHaveBeenCalled();
      const otherMethod = jest.fn();
      model.addEventListener('dispose', otherMethod);
      model.dispose({ silent: true });
      expect(otherMethod).not.toHaveBeenCalled();
    });
  });

  describe('definePrivate', () => {
    it('sets up private non-enumerable, non-configurable properties defined by symbols', () => {
      Model.definePrivate(model, {
        model_private_a: 1,
        model_private_b: 2,
      });
      expect(Reflect.has(model, Symbol.for('model_private_a'))).toBe(true);
      expect(Reflect.has(model, Symbol.for('model_private_b'))).toBe(true);
      expect(model[Symbol.for('model_private_a')]).toBe(1);
      expect(Reflect.has(Object.assign({}, model), Symbol.for('model_private_a'))).toBe(false);
      expect(Reflect.has(Object.assign({}, model), Symbol.for('model_private_b'))).toBe(false);
    });
  });
});
