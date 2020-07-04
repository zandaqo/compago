import isEqual from './is-equal.js';

/**
 * @private {Object} A source of default options for methods to avoid creating new objects on every call.
 */
const opt = Object.seal(Object.create(null));

/**
 * Checks if a value is a "plain" object or an array.
 *
 * @private
 * @param {*} value a value to check
 * @returns {boolean} whether the value is a plain object or an array.
 */
const isObservableObject = (value) => {
  const type = Object.prototype.toString.call(value);
  return type === '[object Object]' || type === '[object Array]';
};

/**
 * @private {symbol}
 */
const arraySymbol = Symbol.for('c-array');

/**
 * @private {symbol}
 */
const pathSymbol = Symbol.for('c-path');

/**
 * @private {symbol}
 */
const modelSymbol = Symbol.for('c-model');

/**
 * The Model in MVC.
 * Implemented as a proxy based observable on top of EventTarget, i.e. it monitors changes to attributes (including
 * nested objects and arrays) and emits events with relevant data when a change occurs.
 * Models also handle synchronization with a persistence layer through given storage controllers.
 *
 * @extends EventTarget
 */
class Model extends EventTarget {
  /**
   * @param {Object} [attributes] the attributes to be set on a newly created model
   */
  constructor(attributes) {
    super();
    Model.definePrivate(this, {
      [arraySymbol]: undefined,
      addEventListener: this.addEventListener.bind(this),
      removeEventListener: this.removeEventListener.bind(this),
      dispatchEvent: this.dispatchEvent.bind(this),
    });
    this.assign(attributes);
    return this.constructor.getProxy(this, '', this, [this]);
  }

  /**
   * Resets all attributes on the model with given attributes.
   *
   * @param {Object} [attributes] the attributes to be set on the model
   * @returns {this}
   * @example
   * const model = new Model({ name: 'Arthur' });
   * //=> { name: 'Arthur' }
   * model.set({ foo: bar });
   * //=> { foo: bar }
   */
  set(attributes) {
    Object.keys(this).forEach((key) => delete this[key]);
    return Object.assign(this, attributes);
  }

  /**
   * Assigns given attributes to the model.
   *
   * @param {Object} [attributes] the attributes to be assigned to the model
   * @returns {this}
   * @example
   * const model = new Model({ name: 'Arthur' });
   * //=> { name: 'Arthur' }
   * model.assign({ foo: bar });
   * //=> { name: 'Arthur', foo: bar }
   */
  assign(attributes) {
    return Object.assign(this, attributes);
  }

  /**
   * Merges two objects. If no target object provided, merges a given source object with the model.
   *
   * @param {Object} source the source object to be merged with the target object.
   * @param {Object} [target=this] the target object to be merged, uses model's attributes by
   *                                    default
   * @returns {Object} the target object
   * @example
   * const model = new Model({ person: { name: 'Arthur' } });
   * model.merge({ person: { surname: 'Dent' } });
   * //=> { person: { name: 'Arthur', surname: 'Dent' } }
   */
  merge(source, target = this) {
    Object.keys(source).forEach((key) => {
      const current = source[key];
      const existing = target[key];
      target[key] =
        isObservableObject(existing) && isObservableObject(current)
          ? this.merge(current, existing)
          : (target[key] = current);
    });
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

  set id(value) {
    this[this.constructor.idAttribute] = value;
  }

  /**
   * Returns a copy of the model's attributes for JSON stringification.
   *
   * @returns {Object}
   */
  toJSON() {
    return { ...this };
  }

  /**
   * Resets the model's state from the storage.
   *
   * @param {Object} [options]
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
  read(options = opt) {
    return this.sync('read', options)
      .then((response) => {
        if (!options.skip) {
          const method = options.method in this ? options.method : 'assign';
          this[method](response);
        }
        this.dispatchEvent(
          new CustomEvent('sync', {
            detail: { emitter: this, response, options, operation: 'read' },
          }),
        );
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
  write(options = opt) {
    return this.sync('write', options)
      .then((response) => {
        if (isObservableObject(response) && !options.skip) {
          const method = options.method in this ? options.method : 'assign';
          this[method](response);
        }
        this.dispatchEvent(
          new CustomEvent('sync', {
            detail: { emitter: this, response, options, operation: 'write' },
          }),
        );
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
   * @returns {Promise}
   * @example
   * model.erase().then((response) => console.log(response)).catch((error) => console.log(error));
   * // removes the stored version of the model and logs the response if successful,
   * // otherwise logs the error
   */
  erase(options = opt) {
    return this.sync('erase', options)
      .then((response) => {
        this.dispatchEvent(
          new CustomEvent('sync', {
            detail: { emitter: this, response, options, operation: 'erase' },
          }),
        );
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
    const array = this[arraySymbol];
    const storage = array?.storage ?? this.constructor.storage;
    if (storage) return storage.sync(method, this, options);
    return Promise.reject(new Error('Storage is not defined.'));
  }

  /**
   * Given a hash of property names and their initial values,
   * sets them up as non-enumerable properties of the model.
   *
   * @param {Object} model the model on which properties are to be set
   * @param {Object} properties a hash of Symbol key names and initial values to be set on the model
   * @returns {void}
   * @example
   * const model = new Model();
   * Model.definePrivate(model, { _privateKey: 1 });
   * model._privateKey
   * //=> 1
   * Object.keys(model)
   * //=> []
   */
  static definePrivate(model, properties) {
    Reflect.ownKeys(properties).forEach((property) => {
      Object.defineProperty(model, property, {
        value: properties[property],
        enumerable: false,
        writable: true,
        configurable: true,
      });
    });
  }

  /**
   * Emits appropriate `change` events when a given property is changed.
   *
   * @private
   * @param {Model} model
   * @param {string} path
   * @param {string} property
   * @param {*} previous
   * @returns {void}
   */
  static emitChanges(model, path, property, previous) {
    model.dispatchEvent(
      new CustomEvent('change', {
        detail: { emitter: model, path: `${path}:${property}`, previous },
      }),
    );
  }

  /**
   * Sets up Proxy objects on Model to monitor changes.
   *
   * @private
   * @param {Object} target the target object to watch for the new Proxy
   * @param {string} path the string path to the object in Model
   * @param {Object} model the model to which the proxy should belong
   * @param {Array} processed an array of already processed objects
   * @returns {Object} a new Proxy object
   */
  static getProxy(target, path, model, processed) {
    let proxy;
    // if the target already has a proxy
    if (target[modelSymbol]) {
      proxy = target;
      proxy[modelSymbol] = model;
      proxy[pathSymbol] = path;
    } else {
      proxy = new Proxy(target, this.proxyHandler);
      this.definePrivate(proxy, {
        [modelSymbol]: model,
        [pathSymbol]: path,
      });
      if (target === model) {
        target[modelSymbol] = proxy;
        model = proxy;
      }
    }

    Object.keys(target).forEach((key) => {
      if (isObservableObject(target[key]) && !processed.includes(target[key])) {
        processed.push(target[key]);
        target[key] = this.getProxy(target[key], `${path}:${key}`, model, processed);
      }
    });
    return proxy;
  }
}

/**
 * @type {RemoteStorage}
 */
Model.storage = undefined;

/**
 * The id property name for the models of the class.
 * @type {string}
 */
Model.idAttribute = '_id';

/**
 * @private
 * @type {Object}
 */
Model.proxyHandler = {
  /**
   * Set operation trap for proxies on Model
   *
   * @private
   * @param {*} target
   * @param {string} property
   * @param {*} value
   * @param {Proxy} receiver
   * @returns {boolean}
   */
  set(target, property, value, receiver) {
    // do not track symbols or non-enumerable properties
    if (
      typeof property === 'symbol' ||
      (Reflect.has(target, property) && !target.propertyIsEnumerable(property))
    ) {
      Reflect.set(target, property, value, receiver);
      return true;
    }
    if (isEqual(target[property], value)) return true;
    const path = target[pathSymbol];
    const model = target[modelSymbol];
    const previous = target[property];
    target[property] = isObservableObject(value)
      ? Model.getProxy(value, `${path}:${property}`, model, [value])
      : value;
    Model.emitChanges(model, path, property, previous);
    return true;
  },

  /**
   * `delete` operation trap for proxies on Model
   *
   * @private
   * @param {*} target
   * @param {string} property
   * @returns {boolean}
   */
  deleteProperty(target, property) {
    if (!Reflect.has(target, property)) return true;
    if (typeof property === 'symbol' || !target.propertyIsEnumerable(property)) {
      delete target[property];
      return true;
    }
    const path = target[pathSymbol];
    const model = target[modelSymbol];
    const previous = target[property];
    delete target[property];
    Model.emitChanges(model, path, property, previous);
    return true;
  },
};

export default Model;
