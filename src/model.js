import clone from 'clone';
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
   * @param {boolean} [options.silent] whether to avoid emitting `change` events
   * @param {boolean} [options.valid] whether to avoid validating the attributes
   * @param {boolean} [options.nested] whether to make changes on nested objects
   */
  constructor(attributes = {}, { collection, storage, silent, valid, nested } = _opt) {
    Object.assign(this, Listener);
    this.data = {};
    this.previous = {};
    this._changing = false;
    this._pending = false;
    this.collection = collection;
    this.storage = storage;
    this.set(attributes, { silent, valid, nested });
  }

  /**
   * The general method to modify the model's data.
   *
   * @param {Object} attributes the hash of attributes to set on the model
   * @param {Object} [options]
   * @param {boolean} [options.unset] whether to remove specified `attributes` from the model
   * @param {boolean} [options.silent] whether to avoid emitting `change` events
   * @param {boolean} [options.valid] whether to avoid validating attributes
   * @param {boolean} [options.nested] whether to make changes on nested objects
   * @param {boolean} [options.past] whether to keep the previous values of the attributes
   *                                  in `this.previous` after the method finishes
   * @param {boolean} [options.circular] whether the provided attributes have circular references
   * @returns {(this|boolean)} either the model if successful or `false` if validation fails
   * @example
   * model.set({ foo: 'bar' });
   * // sets attribute `foo` on the model to 'bar'
   *
   * model.set({ foo: 'bar' }, { valid: true});
   * // skips validation for attributes
   *
   * model.set({ value: 2, 'nestedObj.nestedValue': 1 }, { nested: true });
   * // sets `value` to 2 and `nestedValue` of the `nestedObj` to `1`
   *
   * model.set({ foo: 1 }, { past: true });
   * // saves the previous value of the `foo` attribute in `model.previous`
   */
  set(attributes, options = _opt) {
    if (!attributes) return this;

    const { unset, silent, valid, nested, past, circular = false } = options;

    if (!valid && this.validate(attributes, options)) return false;

    const changes = [];
    const changing = this._changing;
    this._changing = true;

    if (!changing) this.previous = {};

    const attrs = Object.keys(attributes);
    for (let i = attrs.length - 1; i >= 0; i--) {
      let current = this.data;
      let key = attrs[i];
      let firstKey = key;
      const value = attributes[key];
      let currentChanges;

      if (nested && ~key.indexOf('.')) {
        const path = key.split('.');
        firstKey = path[0];
        const nestedResult = this.constructor._resolveNested(path, current);
        if (!nestedResult) continue;
        [key, current, currentChanges] = nestedResult;
      }

      const isValueChanging = unset || !isEqual(current[key], value);

      if (isValueChanging) {
        this.previous[firstKey] = (firstKey in this.previous) ?
          this.previous[firstKey] : clone(this.data[firstKey], circular);
        if (currentChanges) {
          changes.push(...currentChanges);
        } else {
          changes.push(key);
        }
      }

      if (unset) {
        delete current[key];
      } else {
        current[key] = value;
      }
    }

    if (!silent) {
      if (changes.length) this._pending = true;
      for (let i = changes.length - 1; i >= 0; i--) {
        this.emit(`change:${changes[i]}`, { options });
      }
    }

    if (changing) return this;
    if (!silent) {
      while (this._pending) {
        this._pending = false;
        this.emit('change', { options });
      }
    }
    this._pending = false;
    this._changing = false;
    if (!past) this.previous = {};
    return this;
  }

  /**
   * Removes specified attributes from the model.
   *
   * @param {(Array|string)} keys the attribute name(s) to be removed from the model
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid emitting `change` events
   * @param {boolean} [options.valid] whether to avoid validating attributes
   * @param {boolean} [options.nested] whether to make changes on nested objects
   * @param {boolean} [options.past] whether to keep the previous values of the attributes
   *                                  in `this.previous` after the method finishes
   * @returns {(this|boolean)} either the model if successful or `false` if validation fails
   * @example
   * model.unset('foo');
   * // the `foo` attribute is removed from the model
   *
   * model.unset(['foo', 'bar']);
   * // both 'foo' and 'bar' attributes are removed
   */
  unset(keys, options = {}) {
    const attrs = {};

    if (!keys.length) return false;
    const keysArray = (typeof keys === 'string') ? [keys] : keys;
    if (!Array.isArray(keysArray)) return false;

    for (let i = keysArray.length - 1; i >= 0; i--) {
      attrs[keysArray[i]] = undefined;
    }
    options.unset = true;
    return this.set(attrs, options);
  }

  /**
   * Override to include all necessary data validation and coercion logic specific to the model.
   * The convention is for `validate` to return `false` if data is valid.
   *
   * @returns {*}
   */
  validate() {
    return false;
  }

  /**
   * Clears all attributes on the model firing a single `clear` event.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid firing `clear` event
   * @param {boolean} [options.past] whether to save the current model data in `this.previous`
   * @returns {this}
   * @example
   * model.clear();
   * // all attributes are removed from the model
   */
  clear({ past, silent } = _opt) {
    this.previous = past ? this.data : {};
    this.data = {};
    if (!silent) this.emit('clear');
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
    if (this.data.hasOwnProperty(attribute)) return this.data[attribute];
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
   * Returns a hash of changed attributes since the last `set` operation or `false`
   * if no changes are found.
   *
   * @returns {(Object|boolean)}
   */
  changes() {
    const keys = Object.keys(this.previous);
    if (!keys.length) return false;
    const result = {};
    for (let i = keys.length - 1; i >= 0; i--) {
      result[keys[i]] = this.data[keys[i]];
    }
    return result;
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
   * @param {boolean} [options.valid] whether to avoid validating attributes
   * @param {boolean} [options.past] whether to keep the previous values of the attributes
   *                                 in `this.previous` after the method finishes
   * @returns {Promise}
   * @example
   * model.read().then((response) => console.log(response)).catch((error) => console.log(error));
   * // updates the model with the stored version and logs the response if successful,
   * // otherwise logs the error
   *
   * model.read({ valid: true });
   * // skips validation of the retrieved attributes
   *
   * model.read({ past: true });
   * // saves the previous values of changed attributes in `model.previous`
   */
  read(options = _opt) {
    return this.sync('read', options)
      .then((response) => {
        if (!this.set(response, options)) return false;
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
   * @param {boolean} [options.valid] whether to avoid validating attributes if model is updated
   * @param {boolean} [options.past] whether to keep the previous values of the attributes
   *                                  in `this.previous` if model is updated
   * @returns {Promise}
   * @example
   * model.write().then((response) => console.log(response)).catch((error) => console.log(error));
   * // writes the model into the storage and logs the response if successful,
   * // otherwise logs the error
   *
   * model.write({ valid: true });
   * // skips validation of the retrieved attributes if the storage any
   *
   * model.write({ past: true });
   * // saves the previous values of changed attributes in `model.previous`
   */
  write(options = _opt) {
    return this.sync('write', options)
      .then((response) => {
        if ((typeof response === 'object') && !this.set(response, options)) return false;
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

  /**
   * Resolves the path to the nested value and the list of changed nested objects for Model#set.
   *
   * @param {Array} path
   * @param {Object} obj
   * @returns {Array}
   */
  static _resolveNested(path, obj) {
    const changes = [];
    let current = obj;
    for (let j = 0; j < path.length - 1; j++) {
      changes[j] = path[j - 1] ? (`${path[j - 1]}:${path[j]}`) : path[j];
      current = current[path[j]];
    }
    if (typeof current !== 'object') return false;
    const key = path[path.length - 1];
    changes.push(`${changes[changes.length - 1]}:${key}`);
    return [key, current, changes];
  }
}

/**
 * The id property name for the models of the class.
 * @type {string}
 */
Model.idAttribute = '_id';

export default Model;
