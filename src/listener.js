/** Used to split event names */
const _reEventSplitter = /\s+/;

/**
 * Provides methods for event handling.
 *
 * @param {class} Base the base class to extend with Listener
 * @returns {class} a new Listener class extending the base class
 *
 * @class
 */
const Listener = (Base = Object) => class extends Base {
  constructor(...args) {
    super(...args);
    Object.defineProperties(this, {
      [Symbol.for('c_events')]: {
        value: undefined,
        enumerable: false,
        writable: true,
        configurable: true,
      },
      [Symbol.for('c_listeners')]: {
        value: undefined,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    });
  }

  /**
   * Adds an event listener for the specified event(s).
   *
   * The `callback` will be called with `this` being the listener
   * whenever `obj` emits the `name` event.
   *
   * @memberOf Listener
   * @param {Object} obj the object to listen to
   * @param {string} name the event name or names separated by whitespace
   * @param {Function} callback the function to be called when the event is emitted
   * @returns {this}
   * @example
   *
   * Controller.on(Model, 'change', Controller.render);
   * // `Controller.render` will be invoked with `this` set to the Controller
   * // when Model emits a `change` event.
   *
   * Collection.on(Model, 'add remove', Collection.count);
   * // `Collection.count` will be invoked every time the Model emits an `add` or a `remove` event.
   */
  on(obj, name, callback) {
    const names = _reEventSplitter.test(name) ? name.split(_reEventSplitter) : [name];
    const events = obj[Symbol.for('c_events')] || (obj[Symbol.for('c_events')] = new Map());
    const listeners = this[Symbol.for('c_listeners')] || (this[Symbol.for('c_listeners')] = new Map());
    const listensTo = listeners.get(obj) || listeners.set(obj, []).get(obj);

    for (let i = 0, l = names.length; i < l; i += 1) {
      const eventName = names[i];
      const event = events.get(eventName) || events.set(eventName, []).get(eventName);
      event.push([this, callback]);
      if (!~listensTo.indexOf(eventName)) listensTo.push(eventName);
    }
    return this;
  }

  /**
   * Removes event listeners set up by the host object on other objects.
   *
   * @memberOf Listener
   * @param {Object} [obj] the object to stop listening to
   * @param {string} [name] the event name or names
   * @param {Function} [callback] the callback function to be removed
   * @returns {this}
   * @example
   *
   * Controller.off();
   * // the Controller no longer listens to any event on any object.
   *
   * Controller.off(Model);
   * // the Controller no longer listens to any event on the Model.
   *
   * Controller.off(Model, 'change');
   * // no callback will be invoked when the Model emits a `change` event.
   *
   * Controller.off(Model, 'change', this.render);
   * // `this.render` won't be invoked when the Model emits a `change` event.
   */
  off(obj, name, callback) {
    const emitter = this;
    const allListeners = this[Symbol.for('c_listeners')];
    if (!allListeners || !allListeners.size) return this;
    const nameList = name ? _reEventSplitter.test(name) ?
      name.split(_reEventSplitter) : [name] : undefined;
    const deleteListener = !name && !callback;
    let listeners = allListeners;
    if (obj) {
      if (!obj[Symbol.for('c_events')] || !obj[Symbol.for('c_events')].size) return this;
      listeners = new Map();
      listeners.set(obj, allListeners.get(obj));
    }
    listeners.forEach((listensTo, listener) => {
      const names = nameList || listensTo;
      for (let i = names.length - 1; i >= 0; i -= 1) {
        let hasListener;
        const eventName = names[i];
        const events = listener[Symbol.for('c_events')] && listener[Symbol.for('c_events')].get(eventName);
        if (!events) continue;
        for (let j = events.length - 1; j >= 0; j -= 1) {
          if (events[j][0] === emitter) {
            if (callback && callback !== events[j][1]) {
              hasListener = true;
              continue;
            }
            events.splice(j, 1);
          }
        }
        if (!deleteListener && !hasListener) {
          listensTo.splice(listensTo.indexOf(eventName), 1);
        }
        if (!events.length) listener[Symbol.for('c_events')].delete(eventName);
      }
      if (deleteListener || !listensTo[0]) allListeners.delete(listener);
    });

    return this;
  }

  /**
   * Emits `name` and `all` events invoking all the callbacks subscribed to the events.
   *
   * @memberOf Listener
   * @param {string} name the event name
   * @param {Object} [data] the hash of additional parameters that are sent to event listeners
   * @param {Object} [emitter] the emitter of the event
   * @returns {this}
   * @example
   *
   * Controller.on(Model, 'change', Controller.render);
   * Model.emit('change');
   * // `Controller.render` is invoked with a parameter: `{event: 'change', emitter: Model}`
   *
   * Model.emit('change', {previous: 'Zaphod'});
   * // `Controller.render` is invoked with a parameter
   *    `{event: 'change', emitter: Model, previous: 'Zaphod'}`
   *
   * Collection.emit('change', {}, Model);
   * // the third argument can be used to change event emitter,
   * // listeners will be invoked with a parameter `{event: 'change', emitter: Model}`
   */
  emit(name, data = {}, emitter = this) {
    if (!name) return this;
    if (!this[Symbol.for('c_events')] || !this[Symbol.for('c_events')].size) return this;
    const event = this[Symbol.for('c_events')].get(name);
    const all = this[Symbol.for('c_events')].get('all');
    data.event = name;
    data.emitter = emitter;
    const handlers = event ? all ? [].concat(event, all) : event.slice() : all ? all.slice() : [];
    if (handlers.length) {
      for (let i = 0, l = handlers.length; i < l; i += 1) {
        handlers[i][1].call(handlers[i][0], data);
      }
    }
    return this;
  }

  /**
   * Removes all callbacks bound by other objects to the host object.
   *
   * It is used to easily dispose of the object.
   *
   * @memberOf Listener
   * @returns {this}
   * @example
   *
   * Controller.on(Model, 'change', this.render);
   * Collection.on(Model, 'all', this.update);
   * Model.free();
   * // both event listeners are now removed
   * // equivalent to `Collection.off(Model), Controller.off(Model)`
   */
  free() {
    const events = this[Symbol.for('c_events')];
    if (!events) return this;
    events.forEach((event) => {
      event.forEach((listener) => {
        listener[0][Symbol.for('c_listeners')].delete(this);
      });
    });
    this[Symbol.for('c_events')] = undefined;
    return this;
  }
};

export default Listener;
