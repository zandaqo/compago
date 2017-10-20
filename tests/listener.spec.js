import ListenerMixin from '../src/listener';

describe('Listener', () => {
  const Listener = ListenerMixin();
  let a;
  let b;
  let c;

  beforeEach(() => {
    a = new Listener();
    b = new Listener();
    c = new Listener();
    a.firstMethod = jest.fn();
    a.secondMethod = jest.fn();
    c.someMethod = jest.fn();
  });

  describe('on', () => {
    it('adds an event listener', () => {
      a.on(b, 'someEvent anotherEvent', a.firstMethod);
      a.on(b, 'someEvent', a.secondMethod);
      expect(b[Symbol.for('c_events')].get('someEvent')[0][0]).toBe(a);
      expect(b[Symbol.for('c_events')].get('someEvent')[0][1]).toBe(a.firstMethod);
      expect(b[Symbol.for('c_events')].get('someEvent')[1][0]).toBe(a);
      expect(b[Symbol.for('c_events')].get('someEvent')[1][1]).toBe(a.secondMethod);
      expect(b[Symbol.for('c_events')].get('someEvent')[0][0]).toBe(a);
      expect(b[Symbol.for('c_events')].get('someEvent')[0][1]).toBe(a.firstMethod);
      expect(a[Symbol.for('c_listeners')].get(b)).toEqual(['someEvent', 'anotherEvent']);
    });
  });

  describe('off', () => {
    it('removes an event listener', () => {
      a.on(b, 'someEvent', a.firstMethod);
      a.on(b, 'someEvent', a.secondMethod);
      c.on(b, 'someEvent', c.someMethod);
      b.on(b, 'otherEvent', () => {
      });
      a.off(b, 'someEvent', a.firstMethod);
      expect(b[Symbol.for('c_events')].get('someEvent')[0][1]).toBe(a.secondMethod);
      expect(a[Symbol.for('c_listeners')].get(b)).toEqual(['someEvent']);
      a.off(b, 'someEvent', a.secondMethod);
      expect(b[Symbol.for('c_events')].get('someEvent')).toEqual([[c, c.someMethod]]);
      expect(a[Symbol.for('c_listeners')].get(b)).toBe(undefined);
    });

    it('returns if no valid listener is present', () => {
      expect(a.off()).toBe(a);
      a.on(b, 'someEvent', a.firstMethod);
      expect(a.off(b, 'nonEvent')).toBe(a);
      expect(a.off(b, 'firstNonEvent secondNonEvent')).toBe(a);
      expect(a.off({})).toBe(a);
    });

    it('removes all listeners for an event', () => {
      a.on(b, 'someEvent', a.firstMethod);
      a.on(b, 'someEvent', a.secondMethod);
      a.on(b, 'anotherEvent', a.firstMethod);
      expect(b[Symbol.for('c_events')].get('anotherEvent').length).toBe(1);
      expect(b[Symbol.for('c_events')].get('someEvent').length).toBe(2);
      a.off(b, 'someEvent');
      expect(b[Symbol.for('c_events')].get('someEvent')).toBe(undefined);
      expect(b[Symbol.for('c_events')].get('anotherEvent').length).toBe(1);
      expect(a[Symbol.for('c_listeners')].get(b)).toEqual(['anotherEvent']);
    });

    it('removes all listeners set up by the object', () => {
      a.on(b, 'someEvent', a.firstMethod);
      a.on(b, 'someEvent', a.secondMethod);
      a.on(a, 'anotherEvent', a.firstMethod);
      expect(b[Symbol.for('c_events')].get('someEvent').length).toBe(2);
      expect(a[Symbol.for('c_events')].get('anotherEvent').length).toBe(1);
      a.off();
      expect(b[Symbol.for('c_events')].get('someEvent')).toBe(undefined);
      expect(a[Symbol.for('c_events')].get('anotherEvent')).toBe(undefined);
      expect(a[Symbol.for('c_listeners')].size).toBe(0);
    });
  });

  describe('emit', () => {
    it('fires an event', () => {
      a.on(b, 'someEvent', a.firstMethod);
      a.on(b, 'otherEvent', a.secondMethod);
      b.emit('someEvent', { width: 1 });
      expect(a.firstMethod.mock.calls[0][0]).toEqual({
        event: 'someEvent',
        emitter: b,
        width: 1,
      });
      b.emit('otherEvent');
      expect(a.secondMethod.mock.calls[0][0]).toEqual({ event: 'otherEvent', emitter: b });
    });

    it('returns if no event is specified', () => {
      expect(b.emit()).toBe(b);
    });

    it('returns if there  is no listener for any event', () => {
      expect(b.emit('event')).toBe(b);
    });

    it('returns if there is no listener for the event', () => {
      a.on(b, 'someEvent', a.firstMethod);
      expect(b.emit('otherEvent')).toBe(b);
      expect(a.firstMethod).not.toHaveBeenCalled();
    });

    it('emits `all` event every time an event is fired', () => {
      a.on(b, 'someEvent', a.secondMethod);
      a.on(b, 'all', a.firstMethod);
      b.emit('someEvent', { width: 1 });
      expect(a.secondMethod.mock.calls[0][0]).toEqual({
        event: 'someEvent',
        emitter: b,
        width: 1,
      });
      expect(a.firstMethod.mock.calls[0][0]).toEqual({
        event: 'someEvent',
        emitter: b,
        width: 1,
      });
      b.emit('otherEvent');
      expect(a.firstMethod.mock.calls[1][0]).toEqual({ event: 'otherEvent', emitter: b });
      b.emit('someEvent');
      expect(a.firstMethod.mock.calls[2][0]).toEqual({ event: 'someEvent', emitter: b });
      expect(a.secondMethod.mock.calls.length).toBe(2);
      expect(a.firstMethod.mock.calls.length).toBe(3);
    });

    it('passes custom emitter to the event listeners if specified', () => {
      a.on(b, 'someEvent', a.firstMethod);
      b.emit('someEvent', {}, a);
      expect(a.firstMethod.mock.calls[0][0]).toEqual({ event: 'someEvent', emitter: a });
    });
  });

  describe('free', () => {
    it('removes all listeners from the object set up by other objects', () => {
      expect(b.free()).toBe(b);
      a.on(b, 'someEvent', a.firstMethod);
      a.on(b, 'anotherEvent', a.secondMethod);
      expect(a[Symbol.for('c_listeners')].size).toBe(1);
      b.free();
      expect(b[Symbol.for('c_events')]).toBe(undefined);
      expect(a[Symbol.for('c_listeners')].size).toBe(0);
    });
  });
});
