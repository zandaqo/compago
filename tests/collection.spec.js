import Listener from '../src/listener';
import Model from '../src/model';
import Collection from '../src/collection';

describe('Collection', () => {
  let c;
  let m1;
  let m2;
  let m3;

  beforeEach(() => {
    c = new Collection([], { model: Model });
    m1 = new Model();
    m2 = new Model();
    m3 = new Model();
  });

  describe('constructor', () => {
    it('creates a collection', () => {
      const noc = new Collection();
      expect(noc instanceof Collection).toBe(true);
      expect(noc.models.length).toBe(0);
      expect(noc.Model).toBe(Model);
      expect(noc.storage).toBe(undefined);
      expect(noc.comparator).toBe(undefined);

      const storage = {};
      const comparator = 'egg';
      const nc = new Collection(undefined, { storage, comparator });
      expect(nc instanceof Collection).toBe(true);
      expect(nc.models.length).toBe(0);
      expect(nc.Model).toBe(Model);
      expect(nc.storage).toBe(storage);
      expect(nc.comparator).toBe(comparator);
    });
  });

  describe('set', () => {
    it('sets models', () => {
      c.set([m1]);
      expect(c.models[0]).toBe(m1);
      expect(m1.collection).toBe(c);
    });

    it('resets models', () => {
      c.set([m1]);
      c.set([m2, m3]);
      expect(c.models.length).toBe(2);
      expect(c.models[0]).toBe(m2);
      expect(c.models[1]).toBe(m3);
    });

    it('does not change the collection or fire events if existing models are re-setted', () => {
      c.someMethod = jest.fn();
      c.set([m1]);
      c.on(c, 'add', c.someMethod);
      c.set([m1]);
      expect(c.models).toEqual([m1]);
      expect(c.someMethod).not.toHaveBeenCalled();
    });

    it('add models if `keep:true`', () => {
      c.set([m1]);
      c.set([m2, m3], { keep: true });
      expect(c.models.length).toBe(3);
      expect(c.models[0]).toBe(m1);
      expect(c.models[1]).toBe(m2);
      expect(c.models[2]).toBe(m3);
    });

    it('puts models at a specified index', () => {
      const m4 = new Model();
      c.someMethod = jest.fn();
      c.on(m2, 'add', c.someMethod);
      c.on(m4, 'add', c.someMethod);
      c.set([m1, m3]);
      c.set([m2, m4], { keep: true, at: 1 });
      expect(c.models.length).toBe(4);
      expect(c.models[0]).toBe(m1);
      expect(c.models[1]).toBe(m2);
      expect(c.models[2]).toBe(m4);
      expect(c.models[3]).toBe(m3);
      expect(c.someMethod.mock.calls[0][0].at).toBe(1);
      expect(c.someMethod.mock.calls[1][0].at).toBe(2);
    });

    it('adds bare objects converting them to models', () => {
      c.set([{}]);
      expect(c.models[0] instanceof Model).toBe(true);
    });

    it('does not add invalid objects', () => {
      class InvalidModel extends Model {
        validate() {
          return true;
        }
      }
      const nc = new Collection(undefined, { model: InvalidModel });
      nc.someMethod = jest.fn();
      nc.on(nc, 'update', nc.someMethod);
      nc.add({});
      expect(nc.models).toEqual([]);
      expect(nc.someMethod).not.toHaveBeenCalled();
    });

    it('updates existing models', () => {
      c.set({ _id: 1, name: 'Ford' });
      c.set({ _id: 1, name: 'Arthur' }, { keep: true });
      expect(c.models.length).toBe(1);
      expect(c.models[0].get('name')).toBe('Arthur');
    });

    it('re-sorts if updating existing modules change comparable field', () => {
      c.comparator = 'name';
      c.someMethod = jest.fn();
      const a = { _id: 1, name: 'Ford' };
      const b = { _id: 2, name: 'Arthur' };
      c.set(a);
      c.set(b, { keep: true });
      expect(c.models[0].data).toEqual(b);
      expect(c.models[1].data).toEqual(a);
      c.on(c, 'sort', c.someMethod);
      c.set({ _id: 2, name: 'Zoidberg' }, { keep: true });
      expect(c.models[0].data).toEqual(a);
      expect(c.models[1].data).toEqual({ _id: 2, name: 'Zoidberg' });
      expect(c.someMethod).toHaveBeenCalled();
    });

    it('sets models in a correct order', () => {
      c.comparator = 'order';
      m1.set({ order: 3 });
      m2.set({ order: 2 });
      m3.set({ order: 1 });
      c.add([m1, m2, m3]);
      expect(c.models).toEqual([m3, m2, m1]);
    });

    it('forces models to fire `add` events', () => {
      c.someMethod = jest.fn();
      c.on(c, 'add', c.someMethod);
      c.set(m1);
      expect(c.someMethod).toHaveBeenCalled();
      expect(c.someMethod.mock.calls[0][0].event).toBe('add');
      expect(c.someMethod.mock.calls[0][0].emitter).toBe(m1);
    });

    it('fires `sort` event if models have been sorted unless `silent:true`', () => {
      m1.set({ order: 3 });
      m2.set({ order: 2 });
      m3.set({ order: 1 });
      c.comparator = 'order';
      c.someMethod = jest.fn();
      c.on(c, 'sort', c.someMethod);

      c.add([m1, m2, m3], { silent: true });
      expect(c.someMethod).not.toHaveBeenCalled();
      c.clear();

      c.add([m1, m2, m3]);
      expect(c.someMethod).toHaveBeenCalled();
      expect(c.someMethod.mock.calls[0][0].event).toBe('sort');
    });

    it('fires `update` event if collection is changed unless `silent:true`', () => {
      c.someMethod = jest.fn();
      c.on(c, 'update', c.someMethod);
      c.set(m1, { silent: true });
      expect(c.someMethod).not.toHaveBeenCalled();

      c.set(m2);
      expect(c.someMethod).toHaveBeenCalled();
      expect(c.someMethod.mock.calls[0][0].event).toBe('update');
    });
  });

  describe('add', () => {
    it('adds models', () => {
      c.add(m1);
      expect(c.models[0]).toBe(m1);
      c.add(m2);
      expect(c.models[1]).toBe(m2);
      c.add(m1);
      expect(c.models.length).toBe(2);
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      c.add([m1, m2, m3]);
      c.someMethod = jest.fn();
      c.on(c, 'update', c.someMethod);
    });

    it('removes models', () => {
      expect(c.models.length).toBe(3);
      c.remove(m1);
      expect(c.models.length).toBe(2);
      expect(c.models[0]).toBe(m2);
      c.remove([m2, m3]);
      expect(c.models.length).toBe(0);
    });

    it('forces removed models to fire `remove` event', () => {
      m1.someMethod = jest.fn();
      m1.on(m1, 'remove', m1.someMethod);
      c.remove(m1);
      expect(m1.someMethod).toHaveBeenCalled();
      expect(m1.someMethod.mock.calls[0][0].event).toBe('remove');
    });

    it('fires `update` event unless `silent:true`', () => {
      c.add(m1);
      c.remove(m1, { silent: true });
      expect(c.someMethod).not.toHaveBeenCalled();

      c.add(m1);
      c.remove(m1);
      expect(c.someMethod.mock.calls[0][0].event).toBe('update');
      expect(c.someMethod.mock.calls[0][0].emitter).toBe(c);
    });

    it('does not dispose removed models if `save:true`', () => {
      m1.dispose = jest.fn();
      c.remove(m1, { save: true });
      expect(m1.dispose).not.toHaveBeenCalled();
    });

    it('does not remove if the provided model is not in the collection', () => {
      c.remove(new Model());
      expect(c.someMethod).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      c.add([m1, m2]);
      c.someMethod = jest.fn();
      c.otherMethod = jest.fn();
      c.on(c, 'remove', c.otherMethod);
      c.on(c, 'clear', c.someMethod);
    });

    it('empties a collection', () => {
      expect(c.models.length).toBe(2);
      c.clear();
      expect(c.models.length).toBe(0);
    });

    it('fires a single `clear` event unless `silent:true`', () => {
      c.clear({ silent: true });
      expect(c.someMethod).not.toHaveBeenCalled();
      expect(c.otherMethod).not.toHaveBeenCalled();

      c.clear();
      expect(c.someMethod).toHaveBeenCalled();
      expect(c.otherMethod).not.toHaveBeenCalled();
    });

    it('does not dispose removed models if `save:true`', () => {
      m1.dispose = jest.fn();
      c.clear({ save: true });
      expect(m1.dispose).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    let someMethodSpy;

    beforeEach(() => {
      c.someMethod = () => {
      };
      someMethodSpy = jest.spyOn(c, 'someMethod');
      c.on(c, 'remove', c.someMethod);
      c.on(c, 'clear', c.someMethod);
      c.on(c, 'reset', c.someMethod);
    });

    afterEach(() => {
      someMethodSpy.mockRestore();
    });

    it('resets the collection', () => {
      c.add([m1, m2]);
      c.reset([m3, m1]);
      expect(c.models[0]).toBe(m3);
      expect(c.models[1]).toBe(m1);
    });

    it('fires a single `reset` event', () => {
      c.add([m1, m2]);
      c.reset([m3, m1]);
      expect(c.someMethod.mock.calls.length).toEqual(1);
      expect(c.someMethod.mock.calls[0][0].event).toBe('reset');
    });

    it('does not fire any event if `silent:true`', () => {
      c.add([m1, m2]);
      c.reset([m3, m1], { silent: true });
      expect(c.someMethod).not.toHaveBeenCalled();
    });
  });

  describe('push', () => {
    it('adds a model to the end of the collection', () => {
      c.add([m1, m2]);
      c.push(m3);
      expect(c.models[2]).toBe(m3);
    });
  });

  describe('pop', () => {
    it('removes and return the last model', () => {
      c.add([m1, m2]);
      const last = c.pop();
      expect(c.models.length).toBe(1);
      expect(last).toBe(m2);
    });
  });

  describe('unshift', () => {
    it('adds a model to the beginning of the collection', () => {
      c.add([m1, m2]);
      c.unshift(m3);
      expect(c.models[0]).toBe(m3);
    });
  });

  describe('shift', () => {
    it('removes and return the first model', () => {
      c.add([m1, m2]);
      const first = c.shift();
      expect(c.models.length).toBe(1);
      expect(first).toBe(m1);
    });
  });

  describe('sort', () => {
    beforeEach(() => {
      c = new Collection([], { model: Model });
      m1 = new Model({ order: 1 });
      m2 = new Model({ order: 2 });
      m3 = new Model({ order: 3 });
    });

    it('sorts models according to the provided comparator', () => {
      c.add([m3, m2, m1, m2]);
      expect(c.models).toEqual([m3, m2, m1, m2]);
      c.sort({ comparator: 'order' });
      expect(c.models).toEqual([m1, m2, m2, m3]);
    });

    it("sorts models according to collection's comparator", () => {
      c.add([m3, m2, m1]);
      expect(c.models[0]).toBe(m3);
      c.comparator = 'order';
      c.sort();
      expect(c.models[0]).toBe(m1);
    });

    it('fires `sort` event unless `silent:true`', () => {
      c.someMethod = () => {
      };
      const someMethodSpy = jest.spyOn(c, 'someMethod');
      c.on(c, 'sort', c.someMethod);
      c.add([m3, m2, m1]);
      expect(c.models[0]).toBe(m3);
      c.sort({ comparator: 'order' });
      expect(c.models[0]).toBe(m1);
      expect(c.someMethod.mock.calls[0][0].event).toBe('sort');
      someMethodSpy.mockRestore();
    });

    it('sorts in descending order', () => {
      c.add([m1, m3, m2]);
      c.sort({ comparator: 'order', descending: true });
      expect(c.models[0]).toBe(m3);
    });

    it('does not sort if no valid comparator is provided', () => {
      const nc = new Collection();
      nc.someMethod = jest.fn();
      nc.on(nc, 'sort', nc.someMethod);
      nc.sort();
      expect(nc.someMethod).not.toHaveBeenCalled();
    });
  });

  describe('reverse', () => {
    it('reverses the order of the models', () => {
      c.someMethod = () => {
      };
      const someMethodSpy = jest.spyOn(c, 'someMethod');
      c.on(c, 'sort', c.someMethod);
      c.add([m1, m2, m3]);
      c.reverse();
      expect(c.models[0]).toBe(m3);
      expect(c.someMethod.mock.calls[0][0].event).toBe('sort');
      someMethodSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('returns a model', () => {
      c.set(m1);
      m1.set({ _id: 1 });
      expect(c.get(1)).toBe(m1);
      expect(c.get(2)).toBeFalsy();
    });
  });

  describe('has', () => {
    it('checks whether the collection has the model', () => {
      c.set(m1);
      expect(c.has(m1)).toBe(true);
      expect(c.has(m2)).toBe(false);
    });
  });

  describe('at', () => {
    it('returns model at a given index', () => {
      c.set([m1, m2, m3]);
      expect(c.at(0)).toBe(m1);
      expect(c.at(2)).toBe(m3);
      expect(c.at(3)).toBe(undefined);
    });
  });

  describe('where', () => {
    it('returns models with matching attributes', () => {
      const nc = new Collection([], { model: Model });
      const nm1 = new Model({ name: 'Arthur', species: 'Human' });
      const nm2 = new Model({ name: 'Ford', species: 'Betelgeusian' });
      const nm3 = new Model({ name: 'Zaphod', species: 'Betelgeusian' });
      nc.add([nm1, nm2, nm3]);
      expect(nc.where({ species: 'Betelgeusian' })).toEqual([nm2, nm3]);
      expect(nc.where({ name: 'Arthur' })).toEqual([nm1]);
      expect(nc.where({ species: 'Betelgeusian' }, true)).toEqual(nm2);
      expect(nc.where({ age: 10 })).toEqual([]);
      expect(nc.where()).toEqual([]);
    });
  });

  describe('read', () => {
    beforeEach(() => {
      c.sync = () => Promise.resolve([m1, m2, m3]);
      c.someMethod = jest.fn();
    });

    it("updates the collection's models from the storage firing `sync` event", () => {
      c.on(c, 'sync', c.someMethod);
      return c.read().then(() => {
        expect(c.someMethod.mock.calls[0][0].event).toBe('sync');
        expect(c.someMethod.mock.calls[0][0].emitter).toBe(c);
        expect(c.models).toEqual([m1, m2, m3]);
      });
    });

    it('resets models if `reset:true`', () => {
      const resetCallback = jest.fn();
      c.on(c, 'reset', resetCallback);
      return c.read({ reset: true }).then(() => {
        expect(c.models).toEqual([m1, m2, m3]);
        expect(resetCallback).toHaveBeenCalled();
      });
    });

    it('does not fire `sync` event if `silent:true`', () => {
      c.on(c, 'sync', c.someMethod);
      return c.read({ silent: true }).then(() => {
        expect(c.someMethod).not.toHaveBeenCalled();
      });
    });

    it('fires `error` event and rejects if an error happens', () => {
      const error = new Error('404');
      c.sync = () => Promise.reject(error);
      c.on(c, 'error', c.someMethod);
      return c.read().catch((err) => {
        expect(c.someMethod.mock.calls[0][0].event).toBe('error');
        expect(err).toBe(error);
      });
    });
  });

  describe('toJSON', () => {
    it('returns a copy of models for JSON stringification', () => {
      const nc = new Collection([], { model: Model });
      nc.add([new Model({ name: 'Arthur', species: 'Human' }), new Model()]);
      expect(nc.toJSON()).toEqual([{ name: 'Arthur', species: 'Human' }, {}]);
    });
  });

  describe('sync', () => {
    it("calls the sync method of the collection's storage if storage is specified", () => {
      const storage = {
        sync: jest.fn().mockReturnValue(Promise.resolve()),
      };
      const options = {};
      const nc = new Collection(undefined, { storage });
      return nc.sync('read', options).then(() => {
        expect(storage.sync).toHaveBeenCalledWith('read', nc, options);
      });
    });

    it('rejects if no storage is specified', () => {
      const nc = new Collection();
      return nc.sync('read', {}).catch((error) => {
        expect(error.message).toBe('Storage is not defined.');
      });
    });
  });

  describe('dispose', () => {
    beforeEach(() => {
      c.add([m1, m2, m3]);
      c.someMethod = jest.fn();
      c.on(c, 'dispose', c.someMethod);
    });

    it('prepares the collection to be disposed', () => {
      expect(c.models.length).toBe(3);
      c.dispose();
      expect(c.models.length).toBe(0);
      expect(c._listeners.size).toEqual(0);
    });

    it('fires `dispose` event unless `silent:true`', () => {
      c.dispose({ silent: true });
      expect(c.someMethod).not.toHaveBeenCalled();
      c.on(c, 'dispose', c.someMethod);
      c.dispose();
      expect(c.someMethod).toHaveBeenCalled();
    });

    it('disposes removed models if `dispose:true`', () => {
      const a = Object.assign({}, Listener);
      a.onDispose = jest.fn();
      a.on(m1, 'dispose', a.onDispose);
      c.dispose({ dispose: true });
      expect(a.onDispose).toHaveBeenCalled();
    });
  });

  describe('_prepareModel', () => {
    it('prepares a model to be added to the collection', () => {
      expect(c._prepareModel(m1, {})).toBe(m1);
      expect(c._prepareModel({}, {}) instanceof Model).toBe(true);
      class M extends Model {
        validate() {
          return true;
        }
      }
      const b = new Collection([], { model: M });
      const emitSpy = jest.spyOn(b, 'emit');
      expect(b._prepareModel({}, {})).toBe(false);
      expect(b.emit).toHaveBeenCalled();
      emitSpy.mockRestore();
    });
  });

  describe('_onModelEvent', () => {
    it('listens to events on models of the collection', () => {
      const options = {};
      const emitSpy = jest.spyOn(c, 'emit');
      c.add(m1);
      m1.emit('someEvent', options);
      expect(c.emit).toHaveBeenCalledWith('someEvent', options, m1);
      m1.emit('dispose', options);
      expect(c.models.length).toBe(0);
      emitSpy.mockRestore();
    });

    it('does not listen to the events emitted by model being added to another collection', () => {
      const nc = new Collection();
      c.add(m1);
      const emitSpy = jest.spyOn(c, 'emit');
      nc.add(m1);
      expect(m1.collection).toBe(c);
      expect(c.models).toEqual([m1]);
      expect(nc.models).toEqual([m1]);
      expect(c.emit).not.toHaveBeenCalled();
      emitSpy.mockRestore();
    });
  });

  describe('_addReference', () => {
    it('ties a model to the collection', () => {
      const m = new Model();
      c._addReference(m);
      expect(m.collection).toBe(c);
      expect(m._events.get('all')[0]).toEqual([c, c._onModelEvent]);
    });
  });

  describe('_removeReference', () => {
    it("severs a model's ties to the collection", () => {
      const m = new Model();
      c._addReference(m);
      c._removeReference(m);
      expect(m.collection).toBe(undefined);
      expect(m._events.get('all')).toBe(undefined);
    });
  });
});
