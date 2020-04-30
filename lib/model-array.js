import Listener from './listener.js';
import Model from './model.js';

/** Used as a source of default options for methods to avoid creating new objects on every call. */
const _opt = Object.seal(Object.create(null));

/**
 * Manages an ordered set of models providing methods to create, sort, and dispose of the models.
 *
 * @extends Array
 * @extends EventTarget
 */
class ModelArray extends Listener(Array) {
  /**
   * @param {Array.<Model>} [models] models to add to the array
   * @param {Object} [options]
   * @param {Object} [options.storage] the storage controller for the array
   * @param {Object} [options.model]   the class of models in the array
   * @param {(Function|string)} [options.Comparator] a function or an attribute name
   *                                                   that will be used to sort the array
   */
  constructor(models, options = {}) {
    const { storage, model, comparator } = options;
    super();
    this.storage = storage;
    this.Model = model || Model;
    this.comparator = comparator;
    this._byId = {};
    options.silent = true;
    this._onModelEvent = this._onModelEvent.bind(this);
    if (models) this.set(models, options);
  }

  /**
   * The general method to modify the array.
   *
   * @param {(Array|Object)} models a model, a list of models or objects to be added
   *                                to the array or updated if already present
   * @param {Object} [options]
   * @param {number} [options.at]          the position at which the model(s) should be placed
   * @param {boolean} [options.keep]       whether to avoid removing the models not present
   *                                          in the supplied list
   * @param {boolean} [options.skip]       whether to avoid updating existing models
   * @param {boolean} [options.silent]     whether to avoid firing any events
   * @param {boolean} [options.unsorted]   whether to avoid sorting the array
   * @param {boolean} [options.save]       whether to avoid disposing removed models
   * @returns {this}
   * @example
   * let modelArray = new ModelArray([model0]);
   * modelArray.set([model1, model2]);
   * // resets the array models to `[model1, model2]` emitting `add` events on both models,
   * // removes and disposes the existing `model0` which emits the `remove` event
   *
   * modelArray.set(model3, { keep: true });
   * // adds `model3` to the list of array models without removing the existing models
   *
   * modelArray.set(model4, { keep: true, at: 0 });
   * // adds `model4` at the beginning of the array
   *
   * modelArray.set([model2, model3], { save: true });
   * // removes all models except `model2` and `model3` from the array without disposing
   * // the removed models
   *
   * modelArray.set([model1, model4], { keep: true, unsorted: true });
   * // avoids sorting the resulting list of models
   */
  set(models = [], options = {}) {
    const { keep, at, silent, unsorted } = options;

    const sortable = this.comparator && !Number.isInteger(at) && !unsorted;
    const parseResults = this._parseModels(models, options, sortable);
    const [modelSet, toAdd] = parseResults;
    let sort = parseResults[2];
    const toRemove = [];

    if (!keep) {
      for (let i = this.length - 1; i >= 0; i -= 1) {
        const model = this[i];
        if (!modelSet.has(model)) toRemove.push(model);
      }
      if (toRemove.length) this.unset(toRemove, { save: options.save, silent });
    }

    if (toAdd.length) {
      if (sortable) sort = true;
      if (Number.isInteger(at)) {
        super.splice(at, 0, ...toAdd);
      } else {
        super.push(...toAdd);
      }
    }

    if (sort) this.sort({ silent: true });

    if (silent) return this;

    let currentAt = at;
    for (let i = 0; i < toAdd.length; i += 1) {
      toAdd[i].dispatchEvent(
        new CustomEvent('add', {
          detail: {
            emitter: toAdd[i],
            at: currentAt,
            sort,
            collection: this,
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
   * @param {Object} [options]
   * @param {boolean} [options.silent]     whether to avoid firing any events
   * @param {boolean} [options.save]       whether to avoid disposing removed models
   * @returns {this}
   * @example
   * let modelArray = new ModelArray([model1, model2]);
   * modelArray.unset(model1);
   * // removes `model1` from the array emitting `remove` event and disposes it
   *
   * modelArray.unset(mode2, { save: true });
   * // removes `model2` from the array but does not dispose it
   */
  unset(models, { silent, save } = _opt) {
    let hasChanged = false;
    const modelsArray = [].concat(models);
    for (let i = 0; i < modelsArray.length; i += 1) {
      const model = modelsArray[i];
      const index = this.indexOf(model);
      if (!~index) continue;
      super.splice(index, 1);
      hasChanged = true;
      if (!silent) {
        model.dispatchEvent(
          new CustomEvent('remove', {
            detail: {
              emitter: model,
              index,
              collection: this,
              save,
            },
          }),
        );
      }
      this._removeReference(model);
      if (!save) model.dispose();
    }
    if (!silent && hasChanged)
      this.dispatchEvent(new CustomEvent('update', { detail: { emitter: this } }));
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
   * // removes the last model from the array, disposes and returns it
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
   * // removes the first model from the array, disposes and returns it
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
   * @param {boolean} [options.silent] whether to avoid firing the `sort` event
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
   *
   * modelArray.sort({ comparator: (a,b) => a > b, silent: true });
   * // sorts according to the provided comparator function without emitting `sort` event
   */
  sort(options = _opt) {
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

    if (!options || !options.silent) {
      this.dispatchEvent(new CustomEvent('sort', { detail: { emitter: this, options } }));
    }

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
    return this._byId[id];
  }

  /**
   * Returns models with matching attributes.
   *
   * @param {Object} attributes a hash of attributes to match models against
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
   * @param {Object} [options]
   * @param {boolean} [options.silent]   whether to avoid firing events
   * @returns {Promise}
   * @example
   * modelArray.read()
   *  .then((response) => console.log(response))
   *  .catch((error) => console.log(error));
   * // updates the array with the stored version and logs the response if successful,
   * // otherwise logs the error
   */
  read(options = {}) {
    return this.sync('read', options)
      .then((response) => {
        this.set(response, options);
        if (!options.silent)
          this.dispatchEvent(new CustomEvent('sync', { detail: { emitter: this, options } }));
      })
      .catch((error) => {
        this.dispatchEvent(new CustomEvent('error', { detail: { emitter: this, error, options } }));
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
   * @param {Object} options
   * @returns {Promise}
   */
  sync(method, options) {
    if (this.storage) return this.storage.sync(method, this, options);
    return Promise.reject(new Error('Storage is not defined.'));
  }

  /**
   * Prepares the array to be disposed.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid firing `dispose` event
   * @param {boolean} [options.save] whether to avoid disposing removed models
   * @returns {this}
   * @example
   * modelArray.dispose();
   * // disposes the array disposing all its models and emitting the `dispose` event
   *
   * modelArray.dispose({ save: true });
   * // disposes the array without disposing its models
   */
  dispose({ silent, save } = _opt) {
    if (!silent)
      this.dispatchEvent(new CustomEvent('dispose', { detail: { emitter: this, save } }));
    this.unset(this, { silent: true, save });
    return this;
  }

  /**
   * Prepares models to be added or removed from the array.
   *
   * @param {Array} models
   * @param {Object} options
   * @param {boolean} sortable
   * @returns {Array}
   */
  _parseModels(models, options, sortable) {
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
        const model = this._prepareModel(attrs, options);
        if (!model) continue;
        this._addReference(model);
        toAdd.push(model);
      }
    }
    return [modelSet, toAdd, sort];
  }

  /**
   * Checks models before adding them to the array.
   * Creates models from bare objects when necessary.
   *
   * @param {(Model|Object)} data
   * @param {Object} options
   * @returns {Model|boolean}
   */
  _prepareModel(data, options) {
    if (typeof data !== 'object') return false;
    if (data instanceof Model) return data;
    options.collection = this;
    return new this.Model(data, options);
  }

  /**
   * Listens to all events fired by the models in the array.
   *
   * @param {Object} event
   * @returns {void}
   */
  _onModelEvent(event) {
    const {
      type: eventName,
      detail: { emitter: model, collection, previous, path },
    } = event;
    if ((eventName === 'add' || eventName === 'remove') && collection !== this) return;
    if (eventName === 'dispose') {
      this.unset(model, { save: true });
      return;
    }
    if (eventName === 'change' && path.startsWith(`:${model.constructor.idAttribute}`)) {
      this._byId[previous] = undefined;
      if (model.id !== undefined) this._byId[model.id] = model;
    }
    this.dispatchEvent(new CustomEvent(eventName, { detail: event.detail }));
  }

  /**
   * Ties a model to the array.
   *
   * @param {Model} model
   * @returns {void}
   */
  _addReference(model) {
    if (!model[Symbol.for('c_collection')]) model[Symbol.for('c_collection')] = this;
    if (model.id) this._byId[model.id] = model;
    model.addEventListener('add', this._onModelEvent);
    model.addEventListener('remove', this._onModelEvent);
    model.addEventListener('dispose', this._onModelEvent);
    model.addEventListener('change', this._onModelEvent);
  }

  /**
   * Severs a model's ties to the array.
   *
   * @param {Model} model
   * @returns {void}
   */
  _removeReference(model) {
    this._byId[model.id] = undefined;
    if (model[Symbol.for('c_collection')] === this) model[Symbol.for('c_collection')] = undefined;
    model.removeEventListener('add', this._onModelEvent);
    model.removeEventListener('remove', this._onModelEvent);
    model.removeEventListener('dispose', this._onModelEvent);
    model.removeEventListener('change', this._onModelEvent);
  }

  /**
   * @type {ArrayConstructor}
   */
  static get [Symbol.species]() {
    return Array;
  }
}

export default ModelArray;
