import Listener from './listener';

/** Used as a source of default options for methods to avoid creating new objects on every call. */
const _opt = Object.seal(Object.create(null));

/**
 * Facilitates interaction with a REST server through the Fetch API.
 *
 * @extends EventTarget
 */
class RemoteStorage extends Listener() {
  /**
   * @param {Object} [options]
   * @param {string} [options.url] the base URL for requests, by default uses the window's origin
   * @param {Object} [options.init] an options object for custom settings
   *                                to use as the `init` parameter in calls to the global fetch()
   */
  constructor({ url = window.location.origin, init } = _opt) {
    super();
    this.url = url;
    this.init = init || { headers: { 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'include' };
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

  /**
   * The general method for synchronization.
   *
   * @param {string} method a method name to execute.
   *                   Internal method names are mapped to HTTP methods in `RemoteStorage.methods`.
   * @param {(Model|Collection|ModelArray)} model a model or a collection to be synchronized
   * @param {Object} options
   * @param {boolean} [options.silent] whether to avoid firing any events
   * @param {Boolean} [options.patch] whether to send only changed attributes (if present)
   *                                  using the `PATCH` method
   * @param {string} [options.url] a specific url for the request,
   *                               in case it's different from the default url of the storage
   * @param {Object} [options.init] an options object for custom settings
   *                                to use as the `init` parameter in calls to the global fetch()
   * @returns {Promise}
   */
  sync(method, model, { silent, patch, url = this.url, init = this.init } = _opt) {
    const options = Object.assign({}, init);
    const methods = this.constructor.methods;
    options.method = methods[method];
    if (!options.method) return Promise.reject(new Error('Method is not found.'));

    const isStored = this.constructor.isStored(model);
    const changes = (patch && model.changes) ? model.changes : false;

    if (isStored) {
      url += `/${model.id}`;
      if (method === 'write') options.method = changes ? methods.patch : methods.update;
    }

    if (method === 'write') {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(changes || model.toJSON());
    }

    if (!silent) this.dispatchEvent(new CustomEvent('request', { detail: { emitter: this, model, options } }));

    return fetch(url, options)
      .then((response) => {
        if (!silent) this.dispatchEvent(new CustomEvent('response', { detail: { emitter: this, model, options, response } }));
        if (response.ok || response.status === 304) {
          const contentType = response.headers.get('content-type');
          if (contentType && ~contentType.indexOf('application/json')) return response.json();
        } else {
          const error = new Error(response.status);
          error.response = response;
          throw error;
        }
      })
      .catch((error) => {
        throw error;
      });
  }

  /**
   * Prepares the storage controller to be disposed.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid emitting the `dispose` event.
   * @returns {this}
   */
  dispose(options = {}) {
    if (!options.silent) this.dispatchEvent(new CustomEvent('dispose', { detail: { emitter: this } }));
    return this;
  }
}

/**
 * The map translating internal method names to their respective HTTP methods.
 */
RemoteStorage.methods = {
  write: 'POST',
  erase: 'DELETE',
  read: 'GET',
  update: 'PUT',
  patch: 'PATCH',
};

export default RemoteStorage;
