import Listener from './listener.js';
import Model from './model.js';

/**
 * @private
 * @type {Object} Used as a source of default options for methods to avoid creating new objects on every call.
 */
const opt = Object.seal(Object.create(null));

/**
 * @private
 * @type {symbol}
 */
const arraySymbol = Symbol.for('c-array');

/**
 * Manages an ordered set of models providing methods to create, sort, and remove of the models.
 *
 * @extends Array
 * @extends EventTarget
 */
class ModelArray extends Listener(Array) {
  /**
   * @param {Array.<Model|object>} [models] models to add to the array
   * @param {Object} [options]
   * @param {Object} [options.storage] the storage controller for the array
   * @param {Model} [options.model]   the class of models in the array
   * @param {(Function|string)} [options.comparator] a function or an attribute name
   *                                                   that will be used to sort the array
   */
  constructor(models, options = opt) {
    const { storage, model, comparator } = options;
    super();
    this.storage = storage || (model && model.storage);
    this.Model = model || Model;
    this.comparator = comparator;
    this.byId = {};
    this.onModelEvent = this.onModelEvent.bind(this);
    if (models) this.set(models);
  }

  /**
   * The general method to modify the array.
   *
   * @param {(Array|Object)} [models=[]] a model, a list of models or objects to be added
   *                                to the array or updated if already present
   * @param {Object} [options]
   * @param {number} [options.at]          the position at which the model(s) should be placed
   * @param {boolean} [options.keep]       whether to avoid removing the models not present
   *                                          in the supplied list
   * @param {boolean} [options.skip]       whether to avoid updating existing models
   * @param {boolean} [options.unsorted]   whether to avoid sorting the array
   * @returns {this}
   * @example
   * let modelArray = new ModelArray([model0]);
   * modelArray.set([model1, model2]);
   * // resets the array models to `[model1, model2]` emitting `add` events on both models,
   * // removes the existing `model0` which emits the `remove` event
   *
   * modelArray.set(model3, { keep: true });
   * // adds `model3` to the list of array models without removing the existing models
   *
   * modelArray.set(model4, { keep: true, at: 0 });
   * // adds `model4` at the beginning of the array
   *
   * modelArray.set([model1, model4], { keep: true, unsorted: true });
   * // avoids sorting the resulting list of models
   */
  set(models = [], options = opt) {
    const { keep, at, unsorted } = options;

    const sortable = this.comparator && !Number.isInteger(at) && !unsorted;
    const parseResults = this.parseModels(models, options, sortable);
    const [modelSet, toAdd] = parseResults;
    let sort = parseResults[2];
    const toRemove = [];

    if (!keep) {
      for (let i = this.length - 1; i >= 0; i -= 1) {
        const model = this[i];
        if (!modelSet.has(model)) toRemove.push(model);
      }
      if (toRemove.length) this.unset(toRemove);
    }

    if (toAdd.length) {
      if (sortable) sort = true;
      if (Number.isInteger(at)) {
        super.splice(at, 0, ...toAdd);
      } else {
        super.push(...toAdd);
      }
    }

    if (sort) this.sort();

    let currentAt = at;
    for (let i = 0; i < toAdd.length; i += 1) {
      toAdd[i].dispatchEvent(
        new CustomEvent('add', {
          detail: {
            emitter: toAdd[i],
            at: currentAt,
            sort,
            array: this,
          },
        }),
      );
      if (Number.isInteger(at)) currentAt += 1;
    }

    if (sort) this.dispatchEvent(new CustomEvent('sort', { detail: { emitter: this } }));
    if (toAdd.length || toRemove.length)
      this.dispatchEvent(new CustomEvent('update', { detail: { emitter: this } }));
    return this;
  }

  /**
   * Removes a model or a list of models from the array.
   *
   * @param {(Model|Array.<Model>)} models the model(s) to remove from the array
   * @returns {this}
   * @example
   * let modelArray = new ModelArray([model1, model2]);
   * modelArray.unset(model1);
   * // removes `model1` from the array emitting `remove` event
   */
  unset(models) {
    let hasChanged = false;
    const modelsArray = [].concat(models);
    for (let i = 0; i < modelsArray.length; i += 1) {
      const model = modelsArray[i];
      const index = this.indexOf(model);
      if (!~index) continue;
      super.splice(index, 1);
      hasChanged = true;
      model.dispatchEvent(
        new CustomEvent('remove', {
          detail: {
            emitter: model,
            index,
            array: this,
          },
        }),
      );
      this.removeReference(model);
    }
    if (hasChanged) this.dispatchEvent(new CustomEvent('update', { detail: { emitter: this } }));
    return this;
  }

  /**
   * Adds a model(s) to the end of the array.
   *
   * @param {...*} models the model(s) or objects to be added to the array.
   * @returns {this}
   * @example
   * modelArray.push(model);
   * // adds model to the end of the array
   */
  push(...models) {
    return this.set(models, { keep: true, skip: true });
  }

  /**
   * Removes a model from the end of the array.
   *
   * @returns {Model} the removed model
   * @example
   * modelArray.pop();
   * // removes the last model from the array and returns it
   */
  pop() {
    const model = this[this.length - 1];
    this.unset(model);
    return model;
  }

  /**
   * Adds a model(s) to the beginning of the array.
   *
   * @param {...*} models the model(s) or objects to be added to the array.
   * @returns {this}
   * @example
   * modelArray.unshift(model);
   * // adds model to the beginning of the array
   */
  unshift(...models) {
    return this.set(models, { keep: true, skip: true, at: 0 });
  }

  /**
   * Removes a model from the beginning of the array.
   *
   * @returns {Model} the removed model
   * @example
   * modelArray.shift();
   * // removes the first model from the array and returns it
   */
  shift() {
    const model = this[0];
    this.unset(model);
    return model;
  }

  /**
   * Sorts the array.
   *
   * @param {Object|Function} [options]
   * @param {(Function|string)} [options.comparator] a comparator function or an attribute name
   *                                                 for sorting
   * @param {boolean} [options.descending] whether to sort in descending order if the comparator is
   *                                        an attribute name
   * @returns {this}
   * @example
   * modelArray.sort();
   * // attemps to sort the array using its predefined comparator from `this.comparator`
   * // emitting the `sort` event
   *
   * modelArray.sort((a, b) => (a.order > b.order ? 1 : -1));
   * // sorts the array using the provided comparator emitting `sort` event
   *
   * modelArray.sort({ comparator: '_id' });
   * // sorts models according to their `_id` field in ascending order
   *
   * modelArray.sort({ comparator: '_id', descending: true });
   * // sorts according to `_id` field in descending order
   */
  sort(options = opt) {
    if (typeof options === 'function') {
      super.sort(options);
    } else {
      const { descending } = options;
      let comparator = options.comparator || this.comparator;

      if (!comparator) {
        return this;
      }

      if (typeof comparator === 'string') {
        const attribute = comparator;
        comparator = (first, second) => {
          let a = first[attribute];
          let b = second[attribute];

          if (descending) {
            [a, b] = [b, a];
          }

          if (a !== b) {
            if (a > b || a === undefined) {
              return 1;
            }
            if (a < b || b === undefined) {
              return -1;
            }
          }
          return 0;
        };
      }

      super.sort(comparator);
    }
    this.dispatchEvent(new CustomEvent('sort', { detail: { emitter: this, options } }));
    return this;
  }

  /**
   * Reverses the order of the models in the array.
   *
   * @returns {this}
   * @example
   * modelArray.reverse();
   * // reverses the order of models in the array emitting the `sort` event
   */
  reverse() {
    super.reverse();
    this.dispatchEvent(new CustomEvent('sort', { detail: { emitter: this } }));
    return this;
  }

  /**
   * Changes the array in place by removing and/or replacing its models
   * the same way as Array#splice.
   *
   * @param {number} start index at which to start changing the array
   * @param {number} [deleteCount] the number of old array elements to remove,
   *                                defaults to the length of the array
   * @param {...*} [items] the models to add to the array,
   *                                        beginning at the start index
   * @returns {Array}
   * @example
   * const modelArray = new ModelArray([model1, model2, model3]);
   * const result = modelArray.splice(0, 1);
   * // result is `[model1]`
   * // modelArray is `[model2, model3]`
   */
  splice(start, deleteCount, ...items) {
    const startIndex = start >= 0 ? start : this.length + start;
    const endIndex = deleteCount >= 0 ? deleteCount : this.length;
    const models = this.slice(startIndex, startIndex + endIndex);
    this.unset(models);
    if (items && items.length) {
      this.set(items, { keep: true, skip: true, at: start });
    }
    return models;
  }

  /**
   * Gets a model from the array by its id.
   *
   * @param {string} id the model's id
   * @returns {(Model|undefined)} a model or `undefined` if no model is found
   * @example
   * modelArray.get('M123');
   * // returns a model with id `M123` if it's present in the array
   */
  get(id) {
    return this.byId[id];
  }

  /**
   * Returns models with matching attributes.
   *
   * @param {Object} [attributes={}] a hash of attributes to match models against
   * @param {boolean} [first] whether to return the first matching model
   * @returns {Array.<Model>} an array of matching models
   * @example
   * modelArray.where({ day: 'monday', author: 'Joe'});
   * // returns all models whose `day` and `author` attributes values equal
   * // `monday` and `Joe`, respectively
   *
   * modelArray.where({ day: 'monday' }, true);
   * // returns the first matching model
   */
  where(attributes = {}, first) {
    const keys = Object.keys(attributes);
    if (!keys.length) return [];
    return this[first ? 'find' : 'filter']((model) => {
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (attributes[key] !== model[key]) return false;
      }
      return true;
    });
  }

  /**
   * Updates the array with its stored version.
   *
   * @returns {Promise}
   * @example
   * modelArray.read()
   *  .then((response) => console.log(response))
   *  .catch((error) => console.log(error));
   * // updates the array with the stored version and logs the response if successful,
   * // otherwise logs the error
   */
  read() {
    return this.sync('read')
      .then((response) => {
        this.set(response);
        this.dispatchEvent(
          new CustomEvent('sync', { detail: { emitter: this, operation: 'read' } }),
        );
      })
      .catch((error) => {
        this.dispatchEvent(new CustomEvent('error', { detail: { emitter: this, error } }));
        throw error;
      });
  }

  /**
   * Creates a copy of the array's models for JSON stringification.
   *
   * @returns {Array} an array of stringified models
   */
  toJSON() {
    return this.map((model) => model.toJSON());
  }

  /**
   * The general method to synchronize the array.
   * Proxies to the `sync` method of the storage if it's specified.
   *
   * @param {string} method the internal method name.
   * @returns {Promise}
   */
  sync(method) {
    if (this.storage) return this.storage.sync(method, this);
    return Promise.reject(new Error('Storage is not defined.'));
  }

  /**
   * Prepares models to be added or removed from the array.
   *
   * @private
   * @param {Array} models
   * @param {Object} options
   * @param {boolean} options.keep
   * @param {boolean} options.skip
   * @param {boolean} sortable
   * @returns {Array}
   */
  parseModels(models, options, sortable) {
    const { keep, skip } = options;
    const sortAttr = typeof this.comparator === 'string' ? this.comparator : undefined;
    const modelSet = new Set();
    const toAdd = [];
    let sort = false;
    const attrsArray = [].concat(models);
    for (let i = 0; i < attrsArray.length; i += 1) {
      const attrs = attrsArray[i];
      const isModel = attrs instanceof this.Model;
      const existing = isModel
        ? this[this.indexOf(attrs)]
        : this.get(attrs[this.Model.idAttribute]);

      if (existing) {
        if (!keep) modelSet.add(existing);
        if (!skip && !isModel) {
          existing.assign(attrs);
          if (sortable && sortAttr) sort = true;
        }
      } else {
        const model = this.prepareModel(attrs);
        if (!model) continue;
        this.addReference(model);
        toAdd.push(model);
      }
    }
    return [modelSet, toAdd, sort];
  }

  /**
   * Checks models before adding them to the array.
   * Creates models from bare objects when necessary.
   *
   * @private
   * @param {(Model|Object)} data
   * @returns {Model|boolean}
   */
  prepareModel(data) {
    if (typeof data !== 'object') return false;
    if (data instanceof Model) return data;
    return new this.Model(data);
  }

  /**
   * Listens to all events fired by the models in the array.
   *
   * @private
   * @param {CustomEvent} event
   * @returns {void}
   */
  onModelEvent(event) {
    const {
      type: eventName,
      detail: { emitter: model, array, previous, path },
    } = event;
    if ((eventName === 'add' || eventName === 'remove') && array !== this) return;
    if (eventName === 'change' && path.startsWith(`:${model.constructor.idAttribute}`)) {
      this.byId[previous] = undefined;
      if (model.id !== undefined) this.byId[model.id] = model;
    }
    this.dispatchEvent(new CustomEvent(eventName, { detail: event.detail }));
  }

  /**
   * Ties a model to the array.
   *
   * @private
   * @param {Model} model
   * @returns {void}
   */
  addReference(model) {
    if (!model[arraySymbol]) model[arraySymbol] = this;
    if (model.id) this.byId[model.id] = model;
    model.addEventListener('add', this.onModelEvent);
    model.addEventListener('remove', this.onModelEvent);
    model.addEventListener('change', this.onModelEvent);
  }

  /**
   * Severs a model's ties to the array.
   *
   * @private
   * @param {Model} model
   * @returns {void}
   */
  removeReference(model) {
    this.byId[model.id] = undefined;
    if (model[arraySymbol] === this) model[arraySymbol] = undefined;
    model.removeEventListener('add', this.onModelEvent);
    model.removeEventListener('remove', this.onModelEvent);
    model.removeEventListener('change', this.onModelEvent);
  }

  /**
   * @type {ArrayConstructor}
   */
  static get [Symbol.species]() {
    return Array;
  }
}

export default ModelArray;
