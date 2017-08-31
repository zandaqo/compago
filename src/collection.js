import Listener from './listener';
import Model from './model';

/** Used as a source of default options for methods to avoid creating new objects on every call. */
const _opt = Object.seal(Object.create(null));

/**
 * Manages an ordered set of models providing methods to create, sort, and dispose of the models.
 *
 * @mixes Listener
 * @deprecated
 * @private
 */
class Collection {
  /**
   * @param {Array.<Model>} [models] models to add to the collection
   * @param {Object} [options]
   * @param {Object} [options.storage] the storage controller for the collection
   * @param {Object} [options.model]   the class of models in the collection
   * @param {(Function|string)} [options.comparator] a function or an attribute name
   *                                                   that will be used to sort the collection
   */
  constructor(models, options = {}) {
    const { storage, model, comparator } = options;
    Object.assign(this, Listener);
    this.storage = storage;
    this.Model = model || Model;
    this.comparator = comparator;
    this.models = [];
    this._byId = {};
    options.silent = true;
    if (models) this.reset(models, options);
  }

  /**
   * The general method to modify the collection.
   *
   * @param {(Array|Object)} models a model, a list of models or objects to be added
   *                                to the collection or updated if already present
   * @param {Object} options
   * @param {number} [options.at]          the position at which the model(s) should be placed
   * @param {boolean} [options.keep]       whether to avoid removing the models not present
   *                                          in the supplied list
   * @param {boolean} [options.skip]       whether to avoid updating existing models
   * @param {boolean} [options.silent]     whether to avoid firing any events
   * @param {boolean} [options.unsorted]   whether to avoid sorting the collection
   * @param {boolean} [options.save]       whether to avoid disposing removed models
   * @returns {this}
   * @example
   * let collection = new Collection([model0]);
   * collection.set([model1, model2]);
   * // resets the collection models to `[model1, model2]` emitting `add` events on both models,
   * // removes and disposes the existing `model0` which emits the `remove` event
   *
   * collection.set(model3, { keep: true });
   * // adds `model3` to the list of collection models without removing the existing models
   *
   * collection.set(model4, { keep: true, at: 0 });
   * // adds `model4` at the beginning of the collection
   *
   * collection.set([model2, model3], { save: true });
   * // removes all models except `model2` and `model3` from the collection without disposing
   * // the removed models
   *
   * collection.set([model1, model4], { keep: true, unsorted: true });
   * // avoids sorting the resulting list of models
   */
  set(models = [], options = {}) {
    const { keep, at, silent, unsorted } = options;

    const sortable = this.comparator && (at == null) && !unsorted;
    const parseResults = this._parseModels(models, options, sortable);
    const [modelSet, toAdd] = parseResults;
    let sort = parseResults[2];
    const toRemove = [];

    if (!keep) {
      for (let i = this.models.length - 1; i >= 0; i -= 1) {
        const model = this.models[i];
        if (!modelSet.has(model)) toRemove.push(model);
      }
      if (toRemove.length) this.remove(toRemove, { save: options.save, silent });
    }

    if (toAdd.length) {
      if (sortable) sort = true;
      if (at != null) {
        this.models.splice(at, 0, ...toAdd);
      } else {
        this.models.push(...toAdd);
      }
    }

    if (sort) this.sort({ silent: true });

    if (silent) return this;

    let currentAt = at;
    for (let i = 0; i < toAdd.length; i += 1) {
      toAdd[i].emit('add', { at: currentAt, sort, collection: this });
      if (at != null) currentAt += 1;
    }

    if (sort) this.emit('sort');
    if (toAdd.length || toRemove.length) this.emit('update');
    return this;
  }

  /**
   * Adds a model or a list of models to the collection.
   *
   * @param {(Object|Array)} models the model(s) or objects to be added to the collection.
   * @param {Object} [options]
   * @param {number} [options.at]          the position at which the model(s) should be placed
   * @param {boolean} [options.silent]     whether to avoid firing any events
   * @param {boolean} [options.unsorted]   whether to avoid sorting the collection
   * @returns {this}
   * @example
   * let collection = new Collection();
   * collection.add(model0);
   * // adds `model0` to the collection emitting `add` event on the model
   *
   * collection.add(model1, { at: 0 });
   * // adds `model1` at the beginning of the list of collection models
   *
   * collection.add(model3, { unsorted: true });
   * // adds `model3` and avoids re-sorting the resulting list
   */
  add(models, options = {}) {
    options.keep = true;
    options.skip = true;
    return this.set(models, options);
  }

  /**
   * Removes a model or a list of models from the collection.
   *
   * @param {(Model|Array.<Model>)} models the model(s) to remove from the collection
   * @param {Object} [options]
   * @param {boolean} [options.silent]     whether to avoid firing any events
   * @param {boolean} [options.save]       whether to avoid disposing removed models
   * @returns {this}
   * @example
   * let collection = new Collection([model1, model2]);
   * collection.remove(model1);
   * // removes `model1` from the collection emitting `remove` event and disposes it
   *
   * collection.remove(mode2, { save: true });
   * // removes `model2` from the collection but does not dispose it
   */
  remove(models, { silent, save } = _opt) {
    let hasChanged = false;
    const modelsArray = [].concat(models);
    for (let i = 0; i < modelsArray.length; i += 1) {
      const model = modelsArray[i];
      const index = this.models.indexOf(model);
      if (!~index) continue;
      this.models.splice(index, 1);
      hasChanged = true;
      if (!silent) {
        model.emit('remove', { index, collection: this, save });
      }
      this._removeReference(model);
      if (!save) model.dispose();
    }
    if (!silent && hasChanged) this.emit('update');
    return this;
  }

  /**
   * Removes all models from the collection firing a single `clear` event.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent]     whether to avoid firing the `clear` event
   * @param {boolean} [options.save]       whether to avoid disposing removed models
   * @returns {this}
   * @example
   * collection.clear();
   * // removes and disposes all the existing models in the collection
   * // emitting a single `clear` event
   *
   * collection.clear({ save: true });
   * // removes all models without disposing them
   */
  clear({ silent, save } = _opt) {
    const models = this.models;
    for (let i = 0; i < models.length; i += 1) {
      const model = models[i];
      this._removeReference(model);
      if (!save) model.dispose();
    }
    this.models = [];
    this._byId = {};
    if (!silent) {
      this.emit('clear', { save, previousModels: models });
    }
    return this;
  }

  /**
   * Resets the collection with specified list of models firing a single `reset` event.
   *
   * @param {(Object|Array)} models the model(s) or objects to be added to the collection
   * @param {Object} [options]
   * @param {boolean} [options.silent]     whether to avoid firing the `reset` event
   * @param {boolean} [options.save]       whether to avoid disposing removed models
   * @returns {this}
   * @example
   * collection.reset([model1, model2]);
   * // resets the collection emitting a single `reset` event
   *
   * collection.reset([model1, model2], { save: true });
   * // resets the collection but avoids disposing the removed models
   */
  reset(models, { silent, save } = _opt) {
    const previousModels = this.models;
    this.clear({ silent: true, save });
    this.add(models, { silent: true });
    if (!silent) this.emit('reset', { save, previousModels });
    return this;
  }

  /**
   * Adds a model(s) to the end of the collection.
   *
   * @param {(Object|Array)} model the model(s) or objects to be added to the collection.
   * @param {Object} [options]
   * @param {boolean} [options.silent]     whether to avoid firing any events
   * @param {boolean} [options.unsorted]   whether to avoid sorting the collection
   * @returns {this}
   * @example
   * collection.push(model);
   * // adds model to the end of the collection
   */
  push(model, options = {}) {
    options.at = this.models.length;
    return this.add(model, options);
  }

  /**
   * Removes a model from the end of the collection.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent]     whether to avoid firing any events
   * @param {boolean} [options.save]       whether to avoid disposing removed models
   * @returns {Model} the removed model
   * @example
   * collection.pop();
   * // removes the last model from the collection, disposes and returns it
   *
   * collection.pop({ save: true });
   * // removes and returns the last model of the collection without disposing it
   */
  pop(options) {
    const model = this.at(this.models.length - 1);
    this.remove(model, options);
    return model;
  }

  /**
   * Adds a model(s) to the beginning of the collection.
   *
   * @param {(Object|Array)} model the model(s) or objects to be added to the collection.
   * @param {Object} [options]
   * @param {boolean} [options.silent]     whether to avoid firing any events
   * @param {boolean} [options.unsorted]   whether to avoid sorting the collection
   * @returns {this}
   * @example
   * collection.unshift(model);
   * // adds model to the beginning of the collection
   */
  unshift(model, options = {}) {
    options.at = 0;
    return this.add(model, options);
  }

  /**
   * Removes a model from the beginning of the collection.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent]     whether to avoid firing any events
   * @param {boolean} [options.save]       whether to avoid disposing removed models
   * @returns {Model}the removed model
   * @example
   * collection.shift();
   * // removes the first model from the collection, disposes and returns it
   *
   * collection.shift({ save: true });
   * // removes and returns the fist model of the collection without disposing it
   */
  shift(options) {
    const model = this.at(0);
    this.remove(model, options);
    return model;
  }

  /**
   * Sorts the collection.
   *
   * @param {Object} [options]
   * @param {(Function|string)} [options.comparator] a comparator function or an attribute name
   *                                                 for sorting
   * @param {boolean} [options.silent] whether to avoid firing the `sort` event
   * @param {boolean} [options.descending] whether to sort in descending order if the comparator is
   *                                        an attribute name
   * @returns {this}
   * @example
   * collection.sort();
   * // attemps to sort the collection using collection predefined comparator from `this.comparator`
   * // emitting the `sort` event
   *
   * collection.sort({ comparator: '_id' });
   * // sorts models according to their `_id` field in ascending order
   *
   * collection.sort({ comparator: '_id', descending: true });
   * // sorts according to `_id` field in descending order
   *
   * collection.sort({ comparator: (a,b) => a > b });
   * // sorts according to the provided comparator function
   */
  sort(options = _opt) {
    const { silent, descending } = options;
    let comparator = options.comparator || this.comparator;

    if (!comparator) {
      return this;
    }

    if (typeof comparator === 'string') {
      const attribute = comparator;
      comparator = (first, second) => {
        let a = first.get(attribute);
        let b = second.get(attribute);

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

    this.models.sort(comparator);
    if (!silent) this.emit('sort', { options });

    return this;
  }

  /**
   * Reverses the order of the models in the collection.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid firing the `sort` event
   * @returns {this}
   * @example
   * collection.reverse();
   * // reverses the order of models in the collection emitting the `sort` event
   */
  reverse({ silent } = _opt) {
    this.models.reverse();
    if (!silent) this.emit('sort');
    return this;
  }


  /**
   * Gets a model from the collection by its id.
   *
   * @param {string} id the model's id
   * @returns {(Model|undefined)} a model or `undefined` if no model is found
   * @example
   * collection.get('M123');
   * // returns a model with id `M123` if it's present in the collection
   */
  get(id) {
    return this._byId[id];
  }

  /**
   * Checks whether the collection has the model.
   *
   * @param {Model} model the model to look for
   * @returns {boolean} True if the model is in the collection
   * @example
   * collection.has(model1);
   * // returns `true` if collection has the `model1` in it
   */
  has(model) {
    return this.models.indexOf(model) > -1;
  }

  /**
   * Returns a model at the given index.
   *
   * @param {number} index the index at which to look for a model
   * @returns {(Model|undefined)} the model or `undefined` if no model is found
   * @example
   * collection.at(3);
   * // returns the third model of the collection
   */
  at(index) {
    return this.models[index];
  }

  /**
   * Returns models with matching attributes.
   *
   * @param {Object} attributes a hash of attributes to match models against
   * @param {boolean} [first] whether to return the first matching model
   * @returns {Array.<Model>} an array of matching models
   * @example
   * collection.where({ day: 'monday', author: 'Joe'});
   * // returns all models whose `day` and `author` attributes values equal
   * // `monday` and `Joe`, respectively
   *
   * collection.where({ day: 'monday' }, true);
   * // returns the first matching model
   */
  where(attributes = {}, first) {
    const keys = Object.keys(attributes);
    if (!keys.length) return [];
    return this.models[first ? 'find' : 'filter']((model) => {
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (attributes[key] !== model.get(key)) return false;
      }
      return true;
    });
  }

  /**
   * Updates the collection with its stored version.
   *
   * @param {Object} [options]
   * @param {Function} [options.success] the success callback
   * @param {Function} [options.error]   the error callback
   * @param {boolean} [options.silent]   whether to avoid firing events
   * @param {boolean} [options.reset]   whether to pass the response data through the
   *                                      `Collection#reset` method instead of `Collection#set`.
   * @returns {Promise}
   * @example
   * collection.read()
   *  .then((response) => console.log(response))
   *  .catch((error) => console.log(error));
   * // updates the collection with the stored version and logs the response if successful,
   * // otherwise logs the error
   *
   * collection.read({ reset: true });
   * // resets the models with the retrieved ones instead of updating the collection
   */
  read(options = {}) {
    return this.sync('read', options)
      .then((response) => {
        const method = options.reset ? 'reset' : 'set';
        this[method](response, options);
        if (!options.silent) this.emit('sync', { options });
      })
      .catch((error) => {
        this.emit('error', { error, options });
        throw error;
      });
  }

  /**
   * Creates a copy of the collection's models for JSON stringification.
   *
   * @returns {Array} an array of stringified models
   */
  toJSON() {
    return this.models.map(model => model.toJSON());
  }

  /**
   * The general method to synchronize the collection.
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
   * Prepares the collection to be disposed.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid firing `dispose` event
   * @param {boolean} [options.save] whether to avoid disposing removed models
   * @returns {this}
   * @example
   * collection.dispose();
   * // disposes the collection disposing all its models and emitting the `dispose` event
   *
   * collection.dispose({ save: true });
   * // disposes the collection without disposing its models
   */
  dispose({ silent, save } = _opt) {
    if (!silent) this.emit('dispose', { save });
    this.clear({ silent: true, save });
    this.off().free();
    return this;
  }

  /**
   * Prepares models to be added or removed from the collection.
   *
   * @param {Array} models
   * @param {Object} options
   * @param {boolean} sortable
   * @returns {Array}
   */
  _parseModels(models, options, sortable) {
    const { keep, skip } = options;
    const sortAttr = (typeof this.comparator === 'string') ? this.comparator : undefined;
    const modelSet = new Set();
    const toAdd = [];
    let sort = false;
    const attrsArray = [].concat(models);
    for (let i = 0; i < attrsArray.length; i += 1) {
      const attrs = attrsArray[i];
      const isModel = !!(attrs instanceof this.Model);
      const existing = isModel ? this.models[this.models.indexOf(attrs)] :
        this.get(attrs[this.Model.idAttribute]);

      if (existing) {
        if (!keep) modelSet.add(existing);
        if (!skip && !isModel) {
          existing.set(attrs, Object.assign(options, { past: true }));
          if (sortable && sortAttr && (sortAttr in existing.previous)) sort = true;
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
   * Checks models before adding to the collection.
   * Creates models from bare objects when necessary.
   *
   * @param {(Model|Object)} data
   * @param {Object} options
   * @returns {Model|boolean}
   */
  _prepareModel(data, options) {
    if (data instanceof Model) return data;
    options.collection = this;
    const model = new this.Model(data, options);
    if (!model.validate(data, options)) return model;
    options.data = data;
    this.emit('invalid', options);
    return false;
  }

  /**
   * Listens to all events fired by the models in the collection.
   *
   * @param {Object} event
   * @returns {void}
   */
  _onModelEvent(event) {
    const { event: eventName, emitter: model, collection } = event;
    if ((eventName === 'add' || eventName === 'remove') && collection !== this) return;
    if (eventName === 'dispose') {
      this.remove(model, { save: true });
      return;
    }
    if (eventName === (`change:${model.constructor.idAttribute}`)) {
      this._byId[model.previous[model.constructor.idAttribute]] = undefined;
      if (model.id != null) this._byId[model.id] = model;
    }
    this.emit(eventName, event, model);
  }

  /**
   * Ties a model to the collection.
   *
   * @param {Model} model
   * @returns {void}
   */
  _addReference(model) {
    if (!model.collection) model.collection = this;
    if (model.id) this._byId[model.id] = model;
    this.on(model, 'all', this._onModelEvent);
  }

  /**
   * Severs a model's ties to the collection.
   *
   * @param {Model} model
   * @returns {void}
   */
  _removeReference(model) {
    this._byId[model.id] = undefined;
    if (model.collection === this) model.collection = undefined;
    this.off(model, 'all', this._onModelEvent);
  }
}

export default Collection;
