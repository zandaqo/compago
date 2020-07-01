/**
 * @private
 * @type {Object} Used as a source of default options for methods to avoid creating new objects on every call.
 */
const opt = Object.seal(Object.create(null));

/**
 * Facilitates interaction with a REST server through the Fetch API.
 *
 * @extends EventTarget
 */
class RemoteStorage extends EventTarget {
  /**
   * @param {Object} [options]
   * @param {string} [options.url] the base URL for requests, by default uses the window's origin
   * @param {Object} [options.init] an options object for custom settings
   *                                to use as the `init` parameter in calls to the global fetch()
   */
  constructor({ url = globalThis.location.origin, init } = opt) {
    super();
    this.url = url;
    this.init = init;
  }

  /**
   * The general method for synchronization.
   *
   * @param {string} method a method name to execute.
   *                   Internal method names are mapped to HTTP methods in `RemoteStorage.methods`.
   * @param {(Model|ModelArray)} model a model or a collection to be synchronized
   * @param {Object} options
   * @param {boolean} [options.patch] whether to send only changed attributes (if present)
   *                                  using the `PATCH` method
   * @returns {Promise}
   */
  sync(method, model, { patch } = opt) {
    const options = { ...this.init };
    let { url } = this;
    const { methods } = this.constructor;
    options.method = methods[method];
    if (!options.method) return Promise.reject(new Error('Method is not found.'));

    const isStored = this.constructor.isStored(model);
    const changes = patch && model.changes ? model.changes : false;

    if (isStored) {
      url += `/${model.id}`;
      if (method === 'write') options.method = changes ? methods.patch : methods.update;
    }

    if (method === 'write') {
      options.body = this.serialize(changes || model);
    }

    this.dispatchEvent(new CustomEvent('request', { detail: { emitter: this, model, options } }));

    return this.constructor
      .fetch(url, options)
      .then((response) => {
        this.dispatchEvent(
          new CustomEvent('response', {
            detail: {
              emitter: this,
              model,
              options,
              response,
            },
          }),
        );
        if (response.ok || response.status === 304) return this.deserialize(response);
        const error = new Error(response.status);
        error.response = response;
        throw error;
      })
      .catch((error) => {
        throw error;
      });
  }

  /**
   * Serializes data before sending.
   *
   * @param {*} data the data to be serialized
   * @returns {string}
   */
  serialize(data) {
    return JSON.stringify(data);
  }

  /**
   * Deserializes a received response.
   *
   * @param {Response} response the received response
   * @returns {Promise|void}
   */
  deserialize(response) {
    const contentType = response.headers.get('content-type');
    return contentType && ~contentType.indexOf('application/json') ? response.json() : undefined;
  }

  /**
   * Wraps global fetch to apply default headers.
   *
   * @param {string|Request} url the resource to fetch
   * @param {Object} options custom settings for the request
   * @returns {Promise}
   */
  static fetch(url, options = {}) {
    options.headers = { ...this.headers, ...options.headers };
    return window.fetch(url, options);
  }

  /**
   * Checks whether the model has been already persisted on the server.
   *
   * @param {Model} model the model to be checked
   * @returns {boolean} True if the model is already stored on the server
   */
  static isStored(model) {
    return model.id !== undefined;
  }
}

/**
 * @type {Object<string, string>} The map translating internal method names to their respective HTTP methods.
 */
RemoteStorage.methods = {
  write: 'POST',
  erase: 'DELETE',
  read: 'GET',
  update: 'PUT',
  patch: 'PATCH',
};

/**
 * @type {Object<string, string>} Default headers for all fetch requests.
 */
RemoteStorage.headers = {
  'X-Requested-With': 'XMLHttpRequest',
  'Content-Type': 'application/json',
};

export default RemoteStorage;
