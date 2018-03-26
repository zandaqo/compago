import isEqual from 'fast-deep-equal';
import Listener from './listener';

/** Used as a source of default options for methods to avoid creating new objects on every call. */
const _opt = Object.seal(Object.create(null));

/** List of methods derived from EventTarget. */
const _eventMethods = ['addEventListener', 'dispatchEvent', 'removeEventListener'];

/**
 * The Model in MVC.
 * It manages data and business logic. Models handle synchronization with a persistence layer
 * through storage controllers and notify subscribers through events when their data is changed.
 *
 * @extends EventTarget
 */
class Model extends Listener() {
  /**
   * @param {Object} [attributes] the attributes to be set on a newly created model
   * @param {Object} [options]
   * @param {Object} [options.collection] the collection to which the model should belong
   * @param {Object} [options.storage] the storage engine for the model
   */
  constructor(attributes = {}, { collection, storage } = _opt) {
    super();
    Object.defineProperties(this, {
      [Symbol.for('c_collection')]: {
        value: collection,
        enumerable: false,
        writable: true,
        configurable: true,
      },
      [Symbol.for('c_storage')]: {
        value: storage,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    });
    this.set(attributes);
    return this.constructor._getProxy(this, '', this, [this]);
  }

  /**
   * Resets all attributes on the model with given attributes.
   *
   * @param {Object} [attributes] the attributes to be set on the model
   * @returns {this}
   * @example
   * model.set();
   * // all attributes are removed from the model
   *
   * model.set({ foo: bar });
   * model
   * //=>{ foo: bar }
   */
  set(attributes = {}) {
    const keys = Object.keys(this);
    for (let i = 0; i < keys.length; i += 1) {
      delete this[keys[i]];
    }
    Object.assign(this, attributes);
    return this;
  }

  /**
   * Assigns given attributes to the model.
   *
   * @param {Object} attributes the attributes to be assigned to the model
   * @returns {this}
   *
   */
  assign(attributes) {
    Object.assign(this, attributes);
    return this;
  }

  /**
   * Merges two objects, if no target object proveded merges given source object to the model's
   * attributes.
   *
   * @param {Object} source the source object to be merged with the target object.
   * @param {Object} [target=this] the target object to be merged, uses model's attributes by
   *                                    default
   * @returns {Object} the target object
   */
  merge(source, target = this) {
    const keys = Object.keys(source);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const current = source[key];
      const existing = target[key];
      if (typeof existing === 'object' && typeof current === 'object') {
        target[key] = this.merge(current, existing);
      } else {
        target[key] = current;
      }
    }
    return target;
  }

  /**
   * The model's permanent `id`.
   *
   * @type {*}
   */
  get id() {
    return this[this.constructor.idAttribute];
  }

  /**
   * Returns a copy of the model's attributes for JSON stringification.
   *
   * @returns {Object}
   */
  toJSON() {
    return Object.assign({}, this);
  }

  /**
   * Resets the model's state from the storage.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid emitting events
   * @param {boolean} [options.skip] whether to avoid updating existing attributes
   *                                with the received ones
   * @param {string} [options.method=assign] the name of the method to update existing attributes
   * @returns {Promise}
   * @example
   * model.read().then((response) => console.log(response)).catch((error) => console.log(error));
   * // updates the model with the stored version and logs the response if successful,
   * // otherwise logs the error
   *
   * model.read({ skip: true });
   * // skips updating the model with the received attributes
   *
   * model.read({ method: 'merge' });
   * // merges received attributes with the existing ones instead of assigning them
   */
  read(options = _opt) {
    return this.sync('read', options)
      .then((response) => {
        if (!options.skip) {
          const method = options.method in this ? options.method : 'assign';
          this[method](response);
        }
        if (!options.silent) this.dispatchEvent(new CustomEvent('sync', { detail: { emitter: this, response, options } }));
        return response;
      })
      .catch((error) => {
        this.dispatchEvent(new CustomEvent('error', { detail: { emitter: this, error, options } }));
        throw error;
      });
  }

  /**
   * Saves the model into the storage. If the storage responds with an object, updates the model
   * with the response object.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid emitting events
   * @param {boolean} [options.skip] whether to avoid updating existing attributes
   *                                 with the received ones
   * @param {string} [options.method=assign] the name of the method to update existing attributes
   * @returns {Promise}
   * @example
   * model.write().then((response) => console.log(response)).catch((error) => console.log(error));
   * // writes the model into the storage and logs the response if successful,
   * // otherwise logs the error
   *
   * model.write({ skip: true });
   * // skips updating the model with the received attributes
   *
   * model.write({ method: 'merge' });
   * // merges received attributes with the existing ones instead of assigning them
   */
  write(options = _opt) {
    return this.sync('write', options)
      .then((response) => {
        if ((typeof response === 'object') && !options.skip) {
          const method = options.method in this ? options.method : 'assign';
          this[method](response);
        }
        if (!options.silent) this.dispatchEvent(new CustomEvent('sync', { detail: { emitter: this, response, options } }));
        return response;
      })
      .catch((error) => {
        this.dispatchEvent(new CustomEvent('error', { detail: { emitter: this, error, options } }));
        throw error;
      });
  }

  /**
   * Removes the model from the storage.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid emitting events
   * @param {boolean} [options.keep] whether to avoid disposing the model after erasing
   * @returns {Promise}
   * @example
   * model.erase().then((response) => console.log(response)).catch((error) => console.log(error));
   * // removes the stored version of the model and logs the response if successful,
   * // otherwise logs the error
   */
  erase(options = _opt) {
    return this.sync('erase', options)
      .then((response) => {
        if (!options.silent) this.dispatchEvent(new CustomEvent('sync', { detail: { emitter: this, response, options } }));
        if (!options.keep) this.dispose();
        return response;
      })
      .catch((error) => {
        this.dispatchEvent(new CustomEvent('error', { detail: { emitter: this, error, options } }));
        throw error;
      });
  }

  /**
   * The general method to synchronize the model.
   * Proxies to the `sync` method of the storage if it is specified.
   *
   * @param {string} method the internal method name
   * @param {Object} options the options to be sent to the `sync` method of the storage
   * @returns {Promise}
   */
  sync(method, options) {
    const storage = (this[Symbol.for('c_collection')] && this[Symbol.for('c_collection')].storage) ?
      this[Symbol.for('c_collection')].storage : this[Symbol.for('c_storage')];
    if (storage) return storage.sync(method, this, options);
    return Promise.reject(new Error('Storage is not defined.'));
  }

  /**
   * Prepares the model to be disposed by removing all listeners
   * set up by the model or on the model.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid firing the `dispose` event
   * @returns {this}
   * @example
   * model.dispose();
   * // prepares the model for disposal
   */
  dispose({ silent } = _opt) {
    if (!silent) this.dispatchEvent(new CustomEvent('dispose', { detail: { emitter: this } }));
    return this;
  }

  /**
   * Given a hash of property names and their initial values,
   * sets them up on the given model as non-enumerable and non-configurable properties
   * defined by Symbols in the global storage, where Symbol keys correspond to givn property names.
   *
   * @param {Model} model the model on which properties are to be set
   * @param {Object} properties a hash of Symbol key names and initial values to be set on the model
   * @returns {void}
   * @example
   * Model.definePrivate(model, { private_key: 1 });
   * model[Symbol.for('private_key')]
   * //=> 1
   */
  static definePrivate(model, properties) {
    const keys = Object.keys(properties);
    for (let i = 0; i < keys.length; i += 1) {
      Object.defineProperty(model, Symbol.for(keys[i]), {
        value: properties[keys[i]],
        writable: true,
        enumerable: false,
        configurable: false,
      });
    }
  }

  /**
   * Emits appropriate `change` events when a given property is changed.
   *
   * @param {Model} model
   * @param {string} path
   * @param {string} property
   * @param {*} previous
   * @returns {void}
   */
  static _emitChanges(model, path, property, previous) {
    model.dispatchEvent(new CustomEvent('change', {
      detail: { emitter: model, path: `${path}:${property}`, previous },
    }));
  }

  /**
   * Sets up Proxy objects on Model to monitor changes.
   *
   * @param {Object} target the target object to watch for the new Proxy
   * @param {string} path the string path to the object in Model
   * @param {Object} model the model to which the proxy should belong
   * @param {Array} processed an array of already processed objects
   * @returns {Proxy} a new Proxy object
   */
  static _getProxy(target, path, model, processed) {
    let proxy;
    let handler = Model.proxies.get(target);
    if (handler) {
      proxy = target;
      handler.path = path;
      handler.model = model;
    } else {
      handler = { path, model, set: this._setHandler, deleteProperty: this._deleteHandler };
      proxy = new Proxy(target, handler);
      if (target === model) {
        handler.model = proxy;
        handler.get = this._getHandler;
        model = proxy;
      }
      Model.proxies.set(proxy, handler);
    }

    const keys = Object.keys(target);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (typeof target[key] === 'object' && !processed.includes(target[key])) {
        processed.push(target[key]);
        target[key] = this._getProxy(target[key], `${path}:${key}`, model, processed);
      }
    }
    return proxy;
  }

  /**
   * Set operation trap for proxies on Model
   *
   * @param {*} target
   * @param {string} property
   * @param {*} value
   * @returns {boolean}
   */
  static _setHandler(target, property, value) {
    if (typeof property === 'symbol') {
      target[property] = value;
      return true;
    }
    if (isEqual(target[property], value)) return true;
    const { path, model } = this;
    const previous = target[property];
    target[property] = typeof value === 'object' ?
      Model._getProxy(value, `${path}:${property}`, model, [value]) : value;
    Model._emitChanges(model, path, property, previous);
    return true;
  }

  /**
   * `delete` operation trap for proxies on Model
   *
   * @param {*} target
   * @param {string} property
   * @returns {boolean}
   */
  static _deleteHandler(target, property) {
    if (!Reflect.has(target, property)) return true;
    if (typeof property === 'symbol') {
      delete target[property];
      return true;
    }
    const { path, model } = this;
    const previous = target[property];
    delete target[property];
    Model._emitChanges(model, path, property, previous);
    return true;
  }

  /**
   * `get` operation trap for the main proxy of a model.
   *
   * @param {*} target
   * @param {string} property
   * @returns {*}
   */
  static _getHandler(target, property) {
    if (_eventMethods.includes(property)) {
      return function (...args) {
        return Reflect.apply(target[property], target, args);
      };
    }
    return target[property];
  }
}

/**
 * The id property name for the models of the class.
 * @type {string}
 */
Model.idAttribute = '_id';

/**
 * The WeakMap holding references to metadata associated with proxies in Model.
 * @type {WeakMap}
 */
Model.proxies = new WeakMap();

export default Model;
