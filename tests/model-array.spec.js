import Model from '../src/model';
import ModelArray from '../src/model-array';

describe('ModelArray', () => {
  let c;
  let m1;
  let m2;
  let m3;

  beforeEach(() => {
    c = new ModelArray([], { model: Model });
    m1 = new Model();
    m2 = new Model();
    m3 = new Model();
  });

  describe('constructor', () => {
    it('creates an array', () => {
      const noc = new ModelArray();
      expect(noc instanceof ModelArray).toBe(true);
      expect(noc instanceof Array).toBe(true);
      expect(noc.length).toBe(0);
      expect(noc.Model).toBe(Model);
      expect(noc.storage).toBe(undefined);
      expect(noc.comparator).toBe(undefined);

      const storage = {};
      const comparator = 'egg';
      const nc = new ModelArray(undefined, { storage, comparator });
      expect(nc instanceof ModelArray).toBe(true);
      expect(noc instanceof Array).toBe(true);
      expect(nc.length).toBe(0);
      expect(nc.Model).toBe(Model);
      expect(nc.storage).toBe(storage);
      expect(nc.comparator).toBe(comparator);
    });
  });

  describe('set', () => {
    it('sets models', () => {
      c.set([m1]);
      expect(c[0]).toBe(m1);
      expect(m1[Symbol.for('c_collection')]).toBe(c);
    });

    it('resets models', () => {
      c.set([m1]);
      c.set([m2, m3]);
      expect(c.length).toBe(2);
      expect(c[0]).toBe(m2);
      expect(c[1]).toBe(m3);
    });

    it('does not change the array or fire events if existing models are re-setted', () => {
      c.someMethod = jest.fn();
      c.set([m1]);
      c.on(c, 'add', c.someMethod);
      c.set([m1]);
      expect(c.length).toBe(1);
      expect(c[0]).toBe(m1);
      expect(c.someMethod).not.toHaveBeenCalled();
    });

    it('add models if `keep:true`', () => {
      c.set([m1]);
      c.set([m2, m3], { keep: true });
      expect(c.length).toBe(3);
      expect(c[0]).toBe(m1);
      expect(c[1]).toBe(m2);
      expect(c[2]).toBe(m3);
    });

    it('puts models at a specified index', () => {
      const m4 = new Model();
      c.someMethod = jest.fn();
      c.on(m2, 'add', c.someMethod);
      c.on(m4, 'add', c.someMethod);
      c.set([m1, m3]);
      c.set([m2, m4], { keep: true, at: 1 });
      expect(Array.from(c)).toEqual([m1, m2, m4, m3]);
      expect(c.someMethod.mock.calls[0][0].at).toBe(1);
      expect(c.someMethod.mock.calls[1][0].at).toBe(2);
    });

    it('adds bare objects converting them to models', () => {
      c.set([{}]);
      expect(c[0] instanceof Model).toBe(true);
    });

    it('updates existing models', () => {
      c.set({ _id: 1, name: 'Ford' });
      c.set({ _id: 1, name: 'Arthur' }, { keep: true });
      expect(c.length).toBe(1);
      expect(c[0].data.name).toBe('Arthur');
    });

    it('re-sorts if updating existing modules change comparable field', () => {
      c.comparator = 'name';
      c.someMethod = jest.fn();
      const a = { _id: 1, name: 'Ford' };
      const b = { _id: 2, name: 'Arthur' };
      c.set(a);
      c.set(b, { keep: true });
      expect(c[0].data).toEqual(b);
      expect(c[1].data).toEqual(a);
      c.on(c, 'sort', c.someMethod);
      c.set({ _id: 2, name: 'Zoidberg' }, { keep: true });
      expect(c[0].data).toEqual(a);
      expect(c[1].data).toEqual({ _id: 2, name: 'Zoidberg' });
      expect(c.someMethod).toHaveBeenCalled();
    });

    it('sets models in a correct order', () => {
      c.comparator = 'order';
      m1.assign({ order: 3 });
      m2.assign({ order: 2 });
      m3.assign({ order: 1 });
      c.push([m1, m2, m3]);
      expect(Array.from(c)).toEqual([m3, m2, m1]);
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
      m1.assign({ order: 3 });
      m2.assign({ order: 2 });
      m3.assign({ order: 1 });
      c.comparator = 'order';
      c.someMethod = jest.fn();
      c.on(c, 'sort', c.someMethod);

      c.push([m1, m2, m3], { silent: true });
      expect(c.someMethod).not.toHaveBeenCalled();
      c.unset(c);

      c.push([m1, m2, m3]);
      expect(c.someMethod).toHaveBeenCalled();
      expect(c.someMethod.mock.calls[0][0].event).toBe('sort');
    });

    it('fires `update` event if the array is changed unless `silent:true`', () => {
      c.someMethod = jest.fn();
      c.on(c, 'update', c.someMethod);
      c.set(m1, { silent: true });
      expect(c.someMethod).not.toHaveBeenCalled();

      c.set(m2);
      expect(c.someMethod).toHaveBeenCalled();
      expect(c.someMethod.mock.calls[0][0].event).toBe('update');
    });
  });

  describe('unset', () => {
    beforeEach(() => {
      c.push([m1, m2, m3]);
      c.someMethod = jest.fn();
      c.on(c, 'update', c.someMethod);
    });

    it('removes models', () => {
      expect(c.length).toBe(3);
      c.unset(m1);
      expect(c.length).toBe(2);
      expect(c[0]).toBe(m2);
      c.unset([m2, m3]);
      expect(c.length).toBe(0);
    });

    it('forces removed models to fire `remove` event', () => {
      m1.someMethod = jest.fn();
      m1.on(m1, 'remove', m1.someMethod);
      c.unset(m1);
      expect(m1.someMethod).toHaveBeenCalled();
      expect(m1.someMethod.mock.calls[0][0].event).toBe('remove');
    });

    it('fires `update` event unless `silent:true`', () => {
      c.push(m1);
      c.unset(m1, { silent: true });
      expect(c.someMethod).not.toHaveBeenCalled();

      c.push(m1);
      c.unset(m1);
      expect(c.someMethod.mock.calls[0][0].event).toBe('update');
      expect(c.someMethod.mock.calls[0][0].emitter).toBe(c);
    });

    it('does not dispose removed models if `save:true`', () => {
      m1.dispose = jest.fn();
      c.unset(m1, { save: true });
      expect(m1.dispose).not.toHaveBeenCalled();
    });

    it('does not remove if the provided model is not in the array', () => {
      c.unset(new Model());
      expect(c.someMethod).not.toHaveBeenCalled();
    });
  });

  describe('push', () => {
    it('adds a model to the end of the array', () => {
      c.push([m1, m2]);
      c.push(m3);
      expect(c[2]).toBe(m3);
    });
  });

  describe('pop', () => {
    it('removes and return the last model', () => {
      c.push([m1, m2]);
      const last = c.pop();
      expect(c.length).toBe(1);
      expect(last).toBe(m2);
    });
  });

  describe('unshift', () => {
    it('adds a model to the beginning of the array', () => {
      c.push([m1, m2]);
      c.unshift(m3);
      expect(c[0]).toBe(m3);
    });
  });

  describe('shift', () => {
    it('removes and return the first model', () => {
      c.push([m1, m2]);
      const first = c.shift();
      expect(c.length).toBe(1);
      expect(first).toBe(m1);
    });
  });

  describe('sort', () => {
    beforeEach(() => {
      c = new ModelArray([], { model: Model });
      m1 = new Model({ order: 1 });
      m2 = new Model({ order: 2 });
      m3 = new Model({ order: 3 });
    });

    it('sorts models according to the provided comparator', () => {
      c.push([m3, m2, m1, m2]);
      expect(Array.from(c)).toEqual([m3, m2, m1, m2]);
      c.sort({ comparator: 'order' });
      expect(Array.from(c)).toEqual([m1, m2, m2, m3]);
    });

    it("sorts models according to the array's comparator", () => {
      c.push([m3, m2, m1]);
      expect(c[0]).toBe(m3);
      c.comparator = 'order';
      c.sort();
      expect(c[0]).toBe(m1);
    });

    it('fires `sort` event unless `silent:true`', () => {
      c.someMethod = jest.fn();
      c.on(c, 'sort', c.someMethod);
      c.push([m3, m2, m1]);
      expect(c[0]).toBe(m3);
      c.sort({ comparator: 'order' });
      expect(c[0]).toBe(m1);
      expect(c.someMethod.mock.calls[0][0].event).toBe('sort');
    });

    it('sorts in descending order', () => {
      c.push([m1, m3, m2]);
      c.sort({ comparator: 'order', descending: true });
      expect(c[0]).toBe(m3);
    });

    it('does not sort if no valid comparator is provided', () => {
      const nc = new ModelArray();
      nc.someMethod = jest.fn();
      nc.on(nc, 'sort', nc.someMethod);
      nc.sort();
      expect(nc.someMethod).not.toHaveBeenCalled();
    });
  });

  describe('reverse', () => {
    it('reverses the order of the models', () => {
      c.someMethod = jest.fn();
      c.on(c, 'sort', c.someMethod);
      c.push([m1, m2, m3]);
      c.reverse();
      expect(c[0]).toBe(m3);
      expect(c.someMethod.mock.calls[0][0].event).toBe('sort');
    });
  });

  describe('splice', () => {
    it('removes and returns a model from a given index in the array', () => {
      c.push(m1);
      expect(c[0]).toBe(m1);
      const result = c.splice(0);
      expect(result).toEqual([m1]);
      expect(c.length).toBe(0);
    });

    it('removes and returns a number of models starting from a given index', () => {
      c.push([m1, m2, m3]);
      expect(Array.from(c)).toEqual([m1, m2, m3]);
      const result = c.splice(0, 2);
      expect(result).toEqual([m1, m2]);
      expect(c.length).toBe(1);
      expect(c[0]).toBe(m3);
    });

    it('replaces removed models if replacement(s) is provided', () => {
      c.push([m1, m2]);
      expect(c[0]).toBe(m1);
      const result = c.splice(0, 1, m3);
      expect(result).toEqual([m1]);
      expect(c.length).toBe(2);
      expect(Array.from(c)).toEqual([m3, m2]);
    });

    it('handles negative start indexes the same way as Array#splice', () => {
      c.push([m1, m2, m3]);
      expect(Array.from(c)).toEqual([m1, m2, m3]);
      const result = c.splice(-1, 1);
      expect(result).toEqual([m3]);
      expect(c.length).toBe(2);
      expect(Array.from(c)).toEqual([m1, m2]);
    });
  });

  describe('get', () => {
    it('returns a model', () => {
      c.set(m1);
      m1.assign({ _id: 1 });
      expect(c.get(1)).toBe(m1);
      expect(c.get(2)).toBeFalsy();
    });
  });

  describe('where', () => {
    it('returns models with matching attributes', () => {
      const nc = new ModelArray([], { model: Model });
      const nm1 = new Model({ name: 'Arthur', species: 'Human' });
      const nm2 = new Model({ name: 'Ford', species: 'Betelgeusian' });
      const nm3 = new Model({ name: 'Zaphod', species: 'Betelgeusian' });
      nc.push([nm1, nm2, nm3]);
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

    it("updates the array's models from the storage firing `sync` event", () => {
      c.on(c, 'sync', c.someMethod);
      return c.read().then(() => {
        expect(c.someMethod.mock.calls[0][0].event).toBe('sync');
        expect(c.someMethod.mock.calls[0][0].emitter).toBe(c);
        expect(Array.from(c)).toEqual([m1, m2, m3]);
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
      const nc = new ModelArray([], { model: Model });
      nc.push([new Model({ name: 'Arthur', species: 'Human' }), new Model()]);
      expect(nc.toJSON()).toEqual([{ name: 'Arthur', species: 'Human' }, {}]);
    });
  });

  describe('sync', () => {
    it("calls the sync method of the array's storage if storage is specified", () => {
      const storage = {
        sync: jest.fn().mockReturnValue(Promise.resolve()),
      };
      const options = {};
      const nc = new ModelArray(undefined, { storage });
      return nc.sync('read', options).then(() => {
        expect(storage.sync).toHaveBeenCalledWith('read', nc, options);
      });
    });

    it('rejects if no storage is specified', () => {
      const nc = new ModelArray();
      return nc.sync('read', {}).catch((error) => {
        expect(error.message).toBe('Storage is not defined.');
      });
    });
  });

  describe('dispose', () => {
    beforeEach(() => {
      c.push([m1, m2, m3]);
      c.someMethod = jest.fn();
      c.on(c, 'dispose', c.someMethod);
    });

    it('prepares the array to be disposed', () => {
      expect(c.length).toBe(3);
      c.dispose();
      expect(c.length).toBe(0);
      expect(c[Symbol.for('c_listeners')].size).toEqual(0);
    });

    it('fires `dispose` event unless `silent:true`', () => {
      c.dispose({ silent: true });
      expect(c.someMethod).not.toHaveBeenCalled();
      c.on(c, 'dispose', c.someMethod);
      c.dispose();
      expect(c.someMethod).toHaveBeenCalled();
    });

    it('disposes removed models if `dispose:true`', () => {
      const a = new Model();
      a.onDispose = jest.fn();
      a.on(m1, 'dispose', a.onDispose);
      c.dispose({ dispose: true });
      expect(a.onDispose).toHaveBeenCalled();
    });
  });

  describe('_prepareModel', () => {
    it('prepares a model to be added to the array', () => {
      expect(c._prepareModel(m1, {})).toBe(m1);
      expect(c._prepareModel({}, {}) instanceof Model).toBe(true);
      expect(c._prepareModel(1, {})).toBe(false);
    });
  });

  describe('_onModelEvent', () => {
    it('listens to events on the models of the array', () => {
      const options = {};
      const emitSpy = jest.spyOn(c, 'emit');
      c.push(m1);
      m1.emit('someEvent', options);
      expect(c.emit).toHaveBeenCalledWith('someEvent', options, m1);
      m1.emit('dispose', options);
      expect(c.length).toBe(0);
      emitSpy.mockRestore();
    });

    it('does not listen to the events emitted by a model being added to another array', () => {
      const nc = new ModelArray();
      c.push(m1);
      const emitSpy = jest.spyOn(c, 'emit');
      nc.push(m1);
      expect(m1[Symbol.for('c_collection')]).toBe(c);
      expect(Array.from(c)).toEqual([m1]);
      expect(Array.from(nc)).toEqual([m1]);
      expect(c.emit).not.toHaveBeenCalled();
      emitSpy.mockRestore();
    });
  });

  describe('_addReference', () => {
    it('ties a model to the array', () => {
      const m = new Model();
      c._addReference(m);
      expect(m[Symbol.for('c_collection')]).toBe(c);
      expect(m[Symbol.for('c_events')].get('all')[0]).toEqual([c, c._onModelEvent]);
    });
  });

  describe('_removeReference', () => {
    it("severs a model's ties to the array", () => {
      const m = new Model();
      c._addReference(m);
      c._removeReference(m);
      expect(m[Symbol.for('c_collection')]).toBe(undefined);
      expect(m[Symbol.for('c_events')].get('all')).toBe(undefined);
    });
  });
});
