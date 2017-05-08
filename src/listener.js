/** Used to split event names */
const _reEventSplitter = /\s+/;

/**
 * Provides methods for event handling.
 *
 * @mixin
 * @example
 *
 * const emitter = Object.assign({}, Listener);
 * const listener = Object.assign({}, Listener);
 * listener.on(emitter, 'someEvent', listener.doSomething);
 * emitter.emit('someEvent');
 * // listener.doSomething is invoked.
 */
const Listener = {

  _events: undefined,

  _listeners: undefined,

  /**
   * Adds an event listener for the specified event(s).
   *
   * The `callback` will be called with `this` being the listener
   * whenever `obj` emits the `name` event.
   *
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
    const events = obj._events || (obj._events = new Map());
    const listeners = this._listeners || (this._listeners = new Map());
    const listensTo = listeners.get(obj) || listeners.set(obj, []).get(obj);

    for (let i = 0, l = names.length; i < l; i += 1) {
      const eventName = names[i];
      const event = events.get(eventName) || events.set(eventName, []).get(eventName);
      event.push([this, callback]);
      if (!~listensTo.indexOf(eventName)) listensTo.push(eventName);
    }
    return this;
  },

  /**
   * Removes event listeners set up by the host object on other objects.
   *
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
    const allListeners = this._listeners;
    if (!allListeners || !allListeners.size) return this;
    const nameList = name ? _reEventSplitter.test(name) ?
      name.split(_reEventSplitter) : [name] : undefined;
    const deleteListener = !name && !callback;
    let listeners = allListeners;
    if (obj) {
      if (!obj._events || !obj._events.size) return this;
      listeners = new Map();
      listeners.set(obj, allListeners.get(obj));
    }
    listeners.forEach((listensTo, listener) => {
      const names = nameList || listensTo;
      for (let i = names.length - 1; i >= 0; i -= 1) {
        let hasListener;
        const eventName = names[i];
        const events = listener._events && listener._events.get(eventName);
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
        if (!events.length) listener._events.delete(eventName);
      }
      if (deleteListener || !listensTo[0]) allListeners.delete(listener);
    });

    return this;
  },

  /**
   * Emits `name` and `all` events invoking all the callbacks subscribed to the events.
   *
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
    if (!this._events || !this._events.size) return this;
    const event = this._events.get(name);
    const all = this._events.get('all');
    data.event = name;
    data.emitter = emitter;
    const handlers = event ? all ? [].concat(event, all) : event.slice() : all ? all.slice() : [];
    if (handlers.length) {
      for (let i = 0, l = handlers.length; i < l; i += 1) {
        handlers[i][1].call(handlers[i][0], data);
      }
    }
    return this;
  },

  /**
   * Removes all callbacks bound by other objects to the host object.
   *
   * It is used to easily dispose of the object.
   *
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
    const events = this._events;
    if (!events) return this;
    events.forEach((event) => {
      event.forEach((listener) => {
        listener[0]._listeners.delete(this);
      });
    });
    this._events = undefined;
    return this;
  },
};

export default Listener;
