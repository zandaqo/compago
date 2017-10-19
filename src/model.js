import isEqual from 'deep-equal';
import Listener from './listener';

/** Used as a source of default options for methods to avoid creating new objects on every call. */
const _opt = Object.seal(Object.create(null));

/**
 * The Model in MVC.
 * It manages data and business logic. Models handle synchronization with a persistence layer
 * through storage controllers and notify subscribers through events when their data is changed.
 *
 * @mixes Listener
 */
class Model {
  /**
   * @param {Object} [attributes] the attributes to be set on a newly created model
   * @param {Object} [options]
   * @param {Object} [options.collection] the collection to which the model should belong
   * @param {Object} [options.storage] the storage engine for the model
   */
  constructor(attributes = {}, { collection, storage } = _opt) {
    Object.assign(this, Listener);
    this.collection = collection;
    this.storage = storage;
    this.reset(attributes, { silent: true });
  }

  /**
   * Assigns given attributes to the model.
   *
   * @param {Object} attributes the attributes to be assigned to the model
   * @returns {this}
   * @example
   *
   */
  assign(attributes) {
    Object.assign(this.data, attributes);
    return this;
  }

  /**
   * Merges two objects, if no target object proveded merges given source object to the model's
   * attributes.
   *
   * @param {Object} source the source object to be merged with the target object.
   * @param {Object} [target=this.data] the target object to be merged, uses model's attributes by
   *                                    default
   * @returns {Object} the target object
   * @example
   */
  merge(source, target = this.data) {
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
   * Resets all attributes on the model with given attributes firing a single `change` event.
   *
   * @param {Object} [attributes]
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid firing the `change` event
   * @returns {this}
   * @example
   * model.reset();
   * // all attributes are removed from the model
   *
   * model.reset({ foo: bar });
   * model.data
   * //=>{ foo: bar }
   */
  reset(attributes = {}, { silent } = _opt) {
    const previous = this.toJSON();
    this.data = Model._getProxy(attributes, '', this, [attributes]);
    if (!silent) this.emit('change', { previous });
    return this;
  }

  /**
   * Gets a value of a data attribute. If not present, looks it up among the model's getters.
   * For simplicity's sake, any property that isn't a function is considered a getter.
   *
   * @param {string} attribute an attribute or getter name
   * @returns {*} the value of the data attribute or getter
   * @example
   * model.get('foo');
   * // returns the value of the `foo` attribute
   */
  get(attribute) {
    if (Reflect.has(this.data, attribute)) return this.data[attribute];
    const getter = this[attribute];
    return typeof getter !== 'function' ? getter : undefined;
  }

  /**
   * The model's permanent `id`.
   *
   * @type {*}
   */
  get id() {
    return this.data[this.constructor.idAttribute];
  }

  /**
   * Checks whether the model has the attribute.
   *
   * @param {string} attribute the attribute name to look for
   * @returns {boolean}
   */
  has(attribute) {
    return this.data[attribute] !== undefined;
  }

  /**
   * Returns a copy of the model's attributes for JSON stringification.
   *
   * @returns {Object}
   */
  toJSON() {
    return Object.assign({}, this.data);
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
        if (!options.silent) this.emit('sync', { response, options });
        return response;
      })
      .catch((error) => {
        this.emit('error', { error, options });
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
        if (!options.silent) this.emit('sync', { response, options });
        return response;
      })
      .catch((error) => {
        this.emit('error', { error, options });
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
        if (!options.silent) this.emit('sync', { response, options });
        if (!options.keep) this.dispose();
        return response;
      })
      .catch((error) => {
        this.emit('error', { error, options });
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
    const storage = (this.collection && this.collection.storage) ?
      this.collection.storage : this.storage;
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
    if (!silent) this.emit('dispose');
    this.off().free();
    return this;
  }

  static _emitChanges(model, path, property, previous) {
    model.emit(`change${path}:${property}`, { path, previous });
    if (path.includes(':')) {
      const fragments = path.split(':');
      let pathLength = path.length;
      for (let i = fragments.length - 1; i >= 0; i -= 1) {
        model.emit(`change${path.slice(0, pathLength)}`, { path, previous });
        pathLength -= fragments[i].length + 1;
      }
    } else {
      model.emit('change', { path, previous });
    }
  }

  /**
   * Sets up Proxy objects on Model#data to monitor changes.
   *
   * @param {Object} target the target object to watch for the new Proxy
   * @param {string} path the string path to the object in Model#data
   * @param {Model} model the model to which the proxy should belong
   * @param {Array} processed an array of already processed objects
   * @returns {Proxy} a new Proxy object
   */
  static _getProxy(target, path, model, processed) {
    const keys = Object.keys(target);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (typeof target[key] === 'object' && !processed.includes(target[key])) {
        processed.push(target[key]);
        target[key] = this._getProxy(target[key], `${path}:${key}`, model, processed);
      }
    }
    let proxy;
    let handler = Model.proxies.get(target);
    if (handler) {
      proxy = target;
      handler.path = path;
      handler.model = model;
    } else {
      handler = { path, model, set: this._setHandler, deleteProperty: this._deleteHandler };
      proxy = new Proxy(target, handler);
      Model.proxies.set(proxy, handler);
    }
    return proxy;
  }

  /**
   * Set operation trap for proxies on Model#data
   *
   * @param {*} target
   * @param {string} property
   * @param {*} value
   * @returns {boolean}
   */
  static _setHandler(target, property, value) {
    if (isEqual(target[property], value)) return true;
    const { path, model } = this;
    const previous = target[property];
    target[property] = typeof value === 'object' ?
      Model._getProxy(value, `${path}:${property}`, model, [value]) : value;
    Model._emitChanges(model, path, property, previous);
    return true;
  }

  /**
   * `delete` operation trap for proxies on Model#data
   *
   * @param {*} target
   * @param {string} property
   * @returns {boolean}
   */
  static _deleteHandler(target, property) {
    if (!Reflect.has(target, property)) return true;
    const { path, model } = this;
    const previous = target[property];
    delete target[property];
    Model._emitChanges(model, path, property, previous);
    return true;
  }
}

/**
 * The id property name for the models of the class.
 * @type {string}
 */
Model.idAttribute = '_id';

/**
 * The WeakMap holding references to metadata associated with proxies in Model#data.
 * @type {WeakMap}
 */
Model.proxies = new WeakMap();

export default Model;
