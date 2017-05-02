/* eslint-env jest, browser */
/* globals jest, expect */

import Model from '../src/model';

describe('Model', () => {
  let m;
  beforeEach(() => {
    m = new Model({ answer: 42, question: '', person: { name: 'Zaphod', heads: 1 } });
    m.someMethod = jest.fn();
  });

  describe('constructor', () => {
    it('creates a model', () => {
      const collection = {};
      const storage = {};
      const nm = new Model(undefined, { collection, storage });
      expect(nm.collection).toBe(collection);
      expect(nm.storage).toBe(storage);
      expect(nm.data).toEqual({});
    });
  });

  describe('set', () => {
    it('sets up attributes', () => {
      expect(m.data).toEqual({ answer: 42, question: '', person: { name: 'Zaphod', heads: 1 } });
    });

    it('returns if no attribute is provided', () => {
      const nm = new Model();
      nm.validate = jest.fn();
      expect(nm.set()).toBe(nm);
      expect(nm.validate.mock.calls.length).toBe(0);
    });

    it('returns false if validation fails', () => {
      const nm = new Model();
      nm.validate = jest.fn().mockReturnValue(true);
      expect(nm.set({ a: 1 })).toBe(false);
    });

    it('fires `change` events in the right order if the listener to `change` attempts to change the model', () => {
      const eventsArray = [];
      m.someMethod = (event) => {
        eventsArray.push(event.event);
      };
      m.otherMethod = (event) => {
        event.emitter.set({ question: '6x7' });
      };
      const someMethodSpy = jest.spyOn(m, 'someMethod');
      m.on(m, 'change', m.someMethod);
      m.on(m, 'change:answer', m.someMethod);
      m.on(m, 'change:question', m.someMethod);
      m.on(m, 'change:answer', m.otherMethod);
      m.set({ answer: 40 });
      expect(m.someMethod.mock.calls.length).toBe(3);
      expect(eventsArray[0]).toBe('change:answer');
      expect(eventsArray[1]).toBe('change:question');
      expect(eventsArray[2]).toBe('change');
      someMethodSpy.mockRestore();
    });

    it('fires `change` events', () => {
      const eventsArray = [];
      m.someMethod = (event) => {
        eventsArray.push(event.event);
      };
      const someMethodSpy = jest.spyOn(m, 'someMethod');
      m.on(m, 'change', m.someMethod);
      m.on(m, 'change:answer', m.someMethod);
      m.set({ answer: 40 });
      expect(m.someMethod.mock.calls.length).toBe(2);
      expect(m.someMethod.mock.calls.length).toBe(2);
      expect(eventsArray[0]).toBe('change:answer');
      expect(eventsArray[1]).toBe('change');
      someMethodSpy.mockRestore();
    });

    it('preserves changes if `past:true`', () => {
      m.set({ answer: 40 }, { past: true });
      expect(m.previous).toEqual({ answer: 42 });
      expect(m.data.person).toEqual({ name: 'Zaphod', heads: 1 });
      m.set({ 'person.name': 'Arthur', 'person.heads': 3 }, { past: true, nested: true });
      expect(m.data.person).toEqual({ name: 'Arthur', heads: 3 });
      expect(m.previous).toEqual({ person: { name: 'Zaphod', heads: 1 } });
    });

    it('does not fire any event if `silent:true`', () => {
      m.on(m, 'change', m.someMethod);
      m.on(m, 'change:answer', m.someMethod);
      m.set({ answer: 40 }, { silent: true });
      expect(m.someMethod.mock.calls.length).toBe(0);
    });

    it('does not fire change events if attributes do not change', () => {
      m.on(m, 'change', m.someMethod);
      m.on(m, 'change:answer', m.someMethod);
      m.set({ answer: 42 });
      expect(m.someMethod).not.toHaveBeenCalled();
    });

    it('changes a value on a nested object if `nested:true`', () => {
      m.set({ 'person.heads': 2, 'person.arms': 2 }, { nested: true });
      expect(m.data.person.heads).toBe(2);
      expect(m.data.person.arms).toBe(2);
    });

    it('does not change values if a non-existent nested key is provided', () => {
      const changeSpy = jest.fn();
      m.on(m, 'change', changeSpy);
      m.set({ 'answer.asdf.heads': 2 }, { nested: true });
      expect(changeSpy.mock.calls.length).toEqual(0);
      expect(m.data.answer).toBe(42);
      m.off(m, 'change', changeSpy);
    });

    it('fires appropriate `change` events if a nested object is changed', () => {
      const eventsArray = [];
      m.someMethod = (event) => {
        eventsArray.push(event.event);
      };
      const someMethodSpy = jest.spyOn(m, 'someMethod');
      m.on(m, 'change', m.someMethod);
      m.on(m, 'change:person', m.someMethod);
      m.on(m, 'change:person:name', m.someMethod);
      m.set({ 'person.name': 'Ford' }, { nested: true });
      expect(m.data.person.name).toBe('Ford');
      expect(m.someMethod.mock.calls.length).toBe(3);
      expect(eventsArray[0]).toBe('change:person:name');
      expect(eventsArray[1]).toBe('change:person');
      expect(eventsArray[2]).toBe('change');
      someMethodSpy.mockRestore();
    });
  });

  describe('unset', () => {
    it('removes an attribute', () => {
      m.unset('answer', {});
      expect(m.data).toEqual({ question: '', person: { name: 'Zaphod', heads: 1 } });
      expect(m.unset('')).toBe(false);
      m.unset('none');
      expect(m.data).toEqual({ question: '', person: { name: 'Zaphod', heads: 1 } });
      m.unset(['question', 'person']);
      expect(m.data).toEqual({});
    });

    it('removes a list of attributes', () => {
      m.unset(['question', 'person']);
      expect(m.data).toEqual({ answer: 42 });
    });

    it('returns false if invalid attribute name is provided', () => {
      expect(m.unset([])).toBe(false);
      expect(m.unset({ length: 1 })).toBe(false);
    });
  });

  describe('clear', () => {
    it('clears all attributes', () => {
      m.clear();
      expect(m.data).toEqual({});
    });

    it('fires `clear` event unless `silent:true`', () => {
      m.on(m, 'clear', m.someMethod);
      m.clear({ silent: true });
      expect(m.someMethod).not.toHaveBeenCalled();
      m.clear();
      expect(m.someMethod).toHaveBeenCalled();
    });

    it('saves the current attributes in `this.previous` before clearing if `past:true`', () => {
      const previous = m.data;
      m.clear({ past: true });
      expect(m.previous).toEqual(previous);
      expect(m.data).toEqual({});
    });
  });

  describe('id', () => {
    it('returns the id of the model', () => {
      m.set({ _id: 100 });
      expect(m.id).toBe(100);
    });
  });

  describe('get', () => {
    it('returns an attribute', () => {
      expect(m.get('answer')).toBe(42);
      expect(m.get('something')).toBe(undefined);
    });

    it('returns a hash of attributes', () => {
      expect(m.get(['answer', 'question'])).toEqual({ answer: 42, question: '' });
      expect(m.get([])).toEqual({});
      expect(m.get(['something'])).toEqual({ something: undefined });
    });
  });

  describe('has', () => {
    it('checks whether the model has an attribute', () => {
      expect(m.has('answer')).toBe(true);
      expect(m.has('something')).toBe(false);
    });
  });

  describe('changes', () => {
    it('returns a hash of changed attributes or `false`', () => {
      m.set({ answer: 40 }, { past: true });
      expect(m.changes).toEqual({ answer: 40 });
      m.previous = {};
      expect(m.changes).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('returns a copy of attributes', () => {
      expect(m.toJSON()).toEqual(m.data);
      expect(m.toJSON()).not.toBe(m.data);
    });
  });

  describe('read', () => {
    beforeEach(() => {
      m.sync = () => Promise.resolve({ answer: 40 });
    });

    it("resets the model's state from the storage firing `sync` event", () => {
      m.on(m, 'sync', m.someMethod);
      return m.read().then((response) => {
        expect(response).toEqual({ answer: 40 });
        expect(m.someMethod.mock.calls[0][0].event).toBe('sync');
        expect(m.someMethod.mock.calls[0][0].emitter).toBe(m);
        expect(m.get('answer')).toEqual(40);
      });
    });

    it('does not reset the model if returned data fails validation', () => {
      m.validate = jest.fn().mockReturnValue(true);
      return m.read().then((response) => {
        expect(response).toBe(false);
        expect(m.validate).toHaveBeenCalled();
        expect(m.get('answer')).toBe(42);
      });
    });

    it('does not fire `sync` event if `silent:true`', () => {
      m.on(m, 'sync', m.someMethod);
      return m.read({ silent: true }).then(() => {
        expect(m.someMethod).not.toHaveBeenCalled();
      });
    });

    it('fires `error` event and rejects if an error happens', () => {
      const error = new Error('404');
      m.sync = () => Promise.reject(error);
      m.on(m, 'error', m.someMethod);
      return m.read().catch((err) => {
        expect(m.someMethod.mock.calls[0][0].event).toBe('error');
        expect(err).toBe(error);
      });
    });
  });

  describe('write', () => {
    it('saves the model to the storage firing `sync` event', () => {
      m.sync = () => Promise.resolve('');
      m.on(m, 'sync', m.someMethod);
      return m.write().then(() => {
        expect(m.someMethod.mock.calls[0][0].event).toBe('sync');
        expect(m.someMethod.mock.calls[0][0].emitter).toBe(m);
      });
    });

    it('updates the model if the storage returns an object as a response', () => {
      m.sync = () => Promise.resolve({ answer: 40 });
      return m.write().then(() => {
        expect(m.data).toEqual({ answer: 40, question: '', person: { name: 'Zaphod', heads: 1 } });
      });
    });

    it('does not update the model if the storage returns invalid data', () => {
      m.sync = () => Promise.resolve({ answer: 40 });
      m.validate = jest.fn().mockReturnValue(true);
      return m.write().then(() => {
        expect(m.validate).toHaveBeenCalled();
        expect(m.data).toEqual({ answer: 42, question: '', person: { name: 'Zaphod', heads: 1 } });
      });
    });

    it('does not fire `sync` event if `silent:true`', () => {
      m.sync = () => Promise.resolve({ answer: 40 });
      m.on(m, 'sync', m.someMethod);
      return m.write({ silent: true }).then(() => {
        expect(m.someMethod).not.toHaveBeenCalled();
      });
    });

    it('fires `error` event and rejects if an error happens', () => {
      const error = new Error('404');
      m.sync = () => Promise.reject(error);
      m.on(m, 'error', m.someMethod);
      return m.write().catch((err) => {
        expect(m.someMethod.mock.calls[0][0].event).toBe('error');
        expect(err).toBe(error);
      });
    });
  });

  describe('erase', () => {
    it('removes the model from the storage and disposes the model firing `sync` event', () => {
      m.sync = () => Promise.resolve('');
      m.dispose = jest.fn();
      m.on(m, 'sync', m.someMethod);
      return m.erase().then(() => {
        expect(m.someMethod.mock.calls[0][0].event).toBe('sync');
        expect(m.someMethod.mock.calls[0][0].emitter).toBe(m);
        expect(m.dispose).toHaveBeenCalled();
      });
    });

    it('avoids disposing the model if `keep:true`', () => {
      m.sync = () => Promise.resolve('');
      m.dispose = jest.fn();
      m.on(m, 'sync', m.someMethod);
      return m.erase({ keep: true }).then(() => {
        expect(m.someMethod.mock.calls[0][0].event).toBe('sync');
        expect(m.someMethod.mock.calls[0][0].emitter).toBe(m);
        expect(m.dispose).not.toHaveBeenCalled();
      });
    });

    it('does not fire `sync` event if `silent:true`', () => {
      m.sync = () => Promise.resolve('');
      m.on(m, 'sync', m.someMethod);
      return m.erase({ silent: true }).then(() => {
        expect(m.someMethod).not.toHaveBeenCalled();
      });
    });

    it('fires `error` event and rejects if an error happens', () => {
      const error = new Error('404');
      m.sync = () => Promise.reject(error);
      m.on(m, 'error', m.someMethod);
      return m.erase().catch((err) => {
        expect(m.someMethod.mock.calls[0][0].event).toBe('error');
        expect(err).toBe(error);
      });
    });
  });

  describe('sync', () => {
    it('calls `sync` method of the storage', () => {
      m.storage = {};
      m.storage.sync = jest.fn();
      m.sync();
      expect(m.storage.sync).toHaveBeenCalled();
    });

    it('prefers the storage of the collection', () => {
      m.storage = {};
      m.storage.sync = jest.fn();
      m.collection = {};
      m.collection.storage = {};
      m.collection.storage.sync = jest.fn();
      m.sync();
      expect(m.storage.sync).not.toHaveBeenCalled();
      expect(m.collection.storage.sync).toHaveBeenCalled();
    });

    it('rejects if no storage is found', () => {
      return m.sync().catch((error) => {
        expect(error.message).toBe('Storage is not defined.');
      });
    });
  });

  describe('dispose', () => {
    it('prepares the model to be disposed', () => {
      m.on(m, 'dispose', m.someMethod);
      expect(m._events).toBeDefined();
      expect(m._listeners).toBeDefined();
      m.dispose();
      expect(m._events).toBe(undefined);
      expect(m._listeners.size).toEqual(0);
    });

    it('fires `dispose` event unless `silent:true`', () => {
      m.on(m, 'dispose', m.someMethod);
      m.dispose();
      expect(m.someMethod).toHaveBeenCalled();
      const otherMethod = jest.fn();
      m.on(m, 'dispose', otherMethod);
      m.dispose({ silent: true });
      expect(otherMethod).not.toHaveBeenCalled();
    });
  });
});
