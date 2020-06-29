import { jest } from '@jest/globals';
import { Model } from '../index.js';

const collectionSymbol = Symbol.for('c-collection');

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
      const m = new Model(undefined, { collection });
      expect(m instanceof Model).toBe(true);
      expect(m[collectionSymbol]).toBe(collection);
      expect(m.toJSON()).toEqual({});
    });
  });

  describe('data', () => {
    it('emits `change` event when `data` is changed', () => {
      model.addEventListener('change', firstSpy);
      model.answer = 1;
      expect(firstSpy.mock.calls).toEqual([
        [
          expect.objectContaining({
            type: 'change',
            detail: {
              emitter: model,
              path: ':answer',
              previous: 42,
            },
          }),
        ],
      ]);
    });

    it('handles setters', () => {
      class ModelSetters extends Model {
        set setAnswer(value) {
          this.answer = value;
        }
      }

      model = new ModelSetters({ answer: 42, question: '', person: { name: 'Zaphod', heads: 1 } });
      model.addEventListener('change', firstSpy);
      model.setAnswer = 45;
      expect(firstSpy.mock.calls).toEqual([
        [
          expect.objectContaining({
            type: 'change',
            detail: {
              emitter: model,
              path: ':answer',
              previous: 42,
            },
          }),
        ],
      ]);
    });

    it('reacts to changes on nested objects', () => {
      model.addEventListener('change', firstSpy);
      model.person.name = 'Ford';
      expect(firstSpy.mock.calls).toEqual([
        [
          expect.objectContaining({
            type: 'change',
            detail: {
              emitter: model,
              path: ':person:name',
              previous: 'Zaphod',
            },
          }),
        ],
      ]);
    });

    it('reacts to changes on nested arrays', () => {
      model.second = { third: [null] };
      model.addEventListener('change', firstSpy);
      model.second.third.push(1);
      expect(firstSpy.mock.calls).toEqual([
        [
          expect.objectContaining({
            type: 'change',
            detail: {
              emitter: model,
              path: ':second:third:1',
              previous: undefined,
            },
          }),
        ],
      ]);
    });

    it('handles cyclic references', () => {
      const ab = { a: 1, b: 2 };
      ab.c = ab;
      model.first = ab;
      expect(ab[Symbol.for('c-path')]).toEqual(':first');
    });

    it('handles moving attributes within model', () => {
      model.addEventListener('change', firstSpy);
      model.addEventListener('change:first:name', secondSpy);
      model.first = model.person;
      model.person = undefined;
      model.first.name = 'Ford';
      expect(firstSpy.mock.calls.length).toBe(3);
      expect(firstSpy.mock.calls[2]).toEqual([
        expect.objectContaining({
          type: 'change',
          detail: {
            emitter: model,
            path: ':first:name',
            previous: 'Zaphod',
          },
        }),
      ]);
    });

    it('allows usage of any data', () => {
      model.a = new RegExp();
      model.addEventListener('change', firstSpy);
      model.a = new RegExp('abc');
      expect(firstSpy).toHaveBeenCalled();
    });

    it('does not react to changes in instances of built classes that are not Object or Array', () => {
      model.a = new Set();
      model.b = new Map();
      model.addEventListener('change', firstSpy);
      model.a.add(1);
      model.b.set(1, 1);
      expect(model.a.has(1)).toBe(true);
      expect(model.b.has(1)).toBe(true);
      expect(firstSpy).not.toHaveBeenCalled();
    });

    it('does not react to changing symbols', () => {
      model.addEventListener('change', firstSpy);
      model[Symbol.for('m_test')] = 1;
      expect(firstSpy).not.toHaveBeenCalled();
      expect(model[Symbol.for('m_test')]).toBe(1);
    });

    it('does not react to changing non-enumerable properties', () => {
      model.addEventListener('change', firstSpy);
      Object.defineProperty(model, 'abc', { value: 1, enumerable: false, writable: true });
      model.abc = 2;
      expect(firstSpy).not.toHaveBeenCalled();
      expect(model.abc).toBe(2);
    });

    it('reacts to deleting properties', () => {
      model.addEventListener('change', firstSpy);
      delete model.answer;
      expect(firstSpy.mock.calls).toEqual([
        [
          expect.objectContaining({
            type: 'change',
            detail: {
              emitter: model,
              path: ':answer',
              previous: 42,
            },
          }),
        ],
      ]);
    });

    it('does not react to deleting non-existing properties', () => {
      model.addEventListener('change', firstSpy);
      delete model.nonexisting;
      expect(firstSpy).not.toHaveBeenCalled();
    });

    it('does not react to deleting properties set up with symbols', () => {
      model.addEventListener('change', firstSpy);
      delete model[collectionSymbol];
      expect(firstSpy).not.toHaveBeenCalled();
    });

    it('does not react to deleting non-enumerable properties', () => {
      model.addEventListener('change', firstSpy);
      delete model.id;
      expect(firstSpy).not.toHaveBeenCalled();
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

    it('sets the of the model', () => {
      model.id = 200;
      expect(model.id).toBe(200);
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
        expect(model.answer).toEqual(40);
        expect(firstSpy.mock.calls[0][0].type).toBe('sync');
        expect(firstSpy.mock.calls[0][0].detail.emitter).toBe(model);
      });
    });

    it('does not update model if `skip:true`', () =>
      model.read({ skip: true }).then((response) => {
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

    it('resets the model with response if `method:set`', () =>
      model.read({ method: 'set' }).then(() => {
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

    it('fires `error` event and rejects if an error happens', () => {
      const error = new Error('404');
      Object.defineProperty(model, 'sync', {
        value: () => Promise.reject(error),
        enumerable: false,
        configurable: true,
      });
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

    it('updates the model if the storage returns an object as a response', () =>
      model.write().then(() => {
        expect(model.toJSON()).toEqual({
          answer: 40,
          question: '',
          person: { name: 'Zaphod', heads: 1 },
        });
      }));

    it('does not update the model if `skip:true`', () =>
      model.write({ skip: true }).then((response) => {
        expect(response).toEqual({ answer: 40 });
        expect(model.toJSON()).toEqual({
          answer: 42,
          question: '',
          person: { name: 'Zaphod', heads: 1 },
        });
      }));

    it('resets the model with response if `method:set`', () =>
      model.write({ method: 'set' }).then(() => {
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
    it('removes the model from the storage firing `sync` event', () => {
      Object.defineProperty(model, 'sync', {
        value: () => Promise.resolve(''),
        enumerable: false,
        configurable: true,
      });
      model.addEventListener('sync', firstSpy);
      return model.erase().then(() => {
        expect(firstSpy.mock.calls[0][0].type).toBe('sync');
        expect(firstSpy.mock.calls[0][0].detail.emitter).toBe(model);
        expect(firstSpy.mock.calls[0][0].detail.operation).toBe('erase');
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
    class StoredModel extends Model {}
    let storedModel;

    beforeEach(() => {
      StoredModel.storage = {
        sync: jest.fn(),
      };
      storedModel = new StoredModel();
    });

    it('calls `sync` method of the storage', () => {
      storedModel.sync();
      expect(StoredModel.storage.sync).toHaveBeenCalled();
    });

    it('prefers the storage of the collection', () => {
      storedModel[collectionSymbol] = {
        storage: { sync: jest.fn() },
      };
      storedModel.sync();
      expect(StoredModel.storage.sync).not.toHaveBeenCalled();
      expect(storedModel[collectionSymbol].storage.sync).toHaveBeenCalled();
    });

    it('rejects if no storage is found', () =>
      model.sync().catch((error) => {
        expect(error.message).toBe('Storage is not defined.');
      }));
  });

  describe('definePrivate', () => {
    it('sets up private non-enumerable, non-configurable properties defined by symbols', () => {
      Model.definePrivate(model, {
        model_private_a: 1,
        [Symbol.for('model_private_b')]: 2,
      });
      expect(Reflect.has(model, 'model_private_a')).toBe(true);
      expect(Reflect.has(model, Symbol.for('model_private_b'))).toBe(true);
      expect(model.model_private_a).toBe(1);
      expect(Reflect.has({ ...model }, 'model_private_a')).toBe(false);
      expect(Reflect.has({ ...model }, Symbol.for('model_private_b'))).toBe(false);
    });
  });
});
