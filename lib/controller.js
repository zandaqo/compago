/** Used to split event names and selectors in handler declaration. */
const _reSplitEvents = /(\w+)\s+?(.*)/;

/** Used as a source of default options for methods to avoid creating new objects on every call. */
const _opt = Object.seal(Object.create(null));

/**
 * The Controller in MVC.
 * It manages its Model and View while handling user interactions. Controller handles user input
 * through DOM events and updates its Model accordingly. It listens to updates on its Model
 * to re-render its View.
 *
 * @extends HTMLElement
 */
class Controller extends HTMLElement {
  /**
   * @param {Object} [options]
   * @param {Model} [options.model] the model of the controller
   */
  constructor({ model } = _opt) {
    super();
    this.model = model;
    const { handlers, routes, observedAttributes } = this.constructor;
    this._handle = this._handle.bind(this);

    this[Symbol.for('c_fragment')] = '';
    this[Symbol.for('c_modelAttributes')] = observedAttributes.filter((attribute) =>
      attribute.includes(':'),
    );

    if (this[Symbol.for('c_modelAttributes')].length) {
      this._onModelChange = this._onModelChange.bind(this);
    }

    this[Symbol.for('c_handlers')] = handlers ? this._prepareHandlers(handlers) : undefined;
    this._setEventHandlers();
    if (routes) {
      this._onPopstateEvent = this._onPopstateEvent.bind(this);
      window.addEventListener('popstate', this._onPopstateEvent);
    }
  }

  /**
   * Renders the controller.
   *
   * By default, invokes `this.constructor.view`
   * supplying the controller and returns the controller.
   *
   * @returns {Controller} the controller
   */
  render() {
    if (this.constructor.view) this.constructor.view(this);
    return this;
  }

  /**
   * Attaches an event handler to the controller.
   *
   * @param {string} [name] the event name
   * @param {(Function|string)} [callback] the handler function. Can be either a function
   *                                      or a name of the controller's method
   * @param {Object} [options]
   * @param {boolean} [options.handler] if true, the handler is managed by controller's event
   *                                   dispatching system instead of being attached directly.
   * @param {string} [options.selector] the CSS selector to handle events
   *                                    on a specific child element
   * @returns {undefined}
   *
   * @example
   * controller.addEventListener('click', controller.onClick);
   * // attaches `controller.onClick` as a handler for a `click` event directly
   *
   * controller.addEventListener('click', controller.onClick, { handler: true });
   * // registers `controller.onClick` as a handler for a `click`
   * // in controller's event dispatching system
   *
   * controller.addEventListener('click', controller.onButtonClick,
   *                             { handler: true, selector: '#button' });
   * // registers `controller.onButtonClick` as a handler for a `click`
   * // event on the `#button` child element
   */
  addEventListener(name, callback, options = _opt) {
    const { handler, selector } = options;
    if (!handler) {
      super.addEventListener(name, callback, options);
      return;
    }
    this.removeEventListener(name, callback, options);
    if (!this[Symbol.for('c_handlers')]) this[Symbol.for('c_handlers')] = new Map();
    let event = this[Symbol.for('c_handlers')].get(name);
    let cb = callback;
    if (typeof cb === 'string') cb = this[cb];
    if (typeof cb !== 'function') return;
    if (!event) {
      event = this[Symbol.for('c_handlers')].set(name, []).get(name);
      super.addEventListener(name, this._handle);
    }
    event.push(selector ? [cb, selector] : cb);
  }

  /**
   * Detaches an event handler from the controller.
   *
   * @param {string} [name] the event name
   * @param {Function} [callback]  the handler function
   * @param {Object} [options]
   * @param {string} [options.handler] whether the handler is in
   *                                   the controller's event dispatching system
   * @param {string} [options.selector] the CSS selector
   * @returns {undefined}
   *
   * @example
   * controller.removeEventListener('click', controller.onClick);
   * // removes `controller.onClick` as a handler for the `click` event
   *
   * controller.removeEventListener('click', controller.onButtonClick,
   *                                { handler: true, selector: '#button'});
   * // removes `controller.onButtonClick` as a handler
   * // for the `click` events on `#button` child element
   * // from the controller's event dispatching system
   */
  removeEventListener(name, callback, options = _opt) {
    const { handler, selector } = options;
    if (!handler) {
      super.removeEventListener(name, callback, options);
      return;
    }
    const handlers = this[Symbol.for('c_handlers')] && this[Symbol.for('c_handlers')].get(name);
    if (!handlers) return;
    if (!selector) {
      const index = handlers.indexOf(callback);
      if (~index) handlers.splice(index, 1);
    } else {
      handlers.forEach((cb, i) => {
        if (Array.isArray(cb) && callback === cb[0] && selector === cb[1]) {
          handlers.splice(i, 1);
        }
      });
    }
    if (!handlers.length) {
      this[Symbol.for('c_handlers')].delete(name);
      super.removeEventListener(name, this._handle);
    }
  }

  /**
   * Saves a fragment into the browser history.
   *
   * @param {string} fragment a properly URL-encoded fragment to place into the history
   * @param {Object} [options]
   * @param {boolean} [options.replace] whether to change the current item in the history
   *                                    instead of adding a new one
   * @param {boolean} [options.silent]  whether to avoid checking the fragment for routes
   * @returns {boolean}
   * @example
   * controller.navigate('/users');
   * // sets the current URL to '/users', pushes it into history, and checks the new URL for routes
   *
   * controller.navigate('/users', { replace: true });
   * // replaces the current URL with '/users' and checks it for routes
   *
   * controller.navigate('/users', { silent: true });
   * // does not check the new URL for routes
   */
  navigate(fragment, { replace, silent } = _opt) {
    const path = this._getFragment(fragment);
    if (this[Symbol.for('c_fragment')] === path) return false;
    this[Symbol.for('c_fragment')] = path;
    const url = this.constructor.root + path;
    this.constructor[Symbol.for('c_history')][replace ? 'replaceState' : 'pushState'](
      {},
      document.title,
      url,
    );
    if (!silent) this._checkUrl();
    return true;
  }

  /**
   * Prepares the controller to be disposed.
   *
   * Removes the controller from the DOM, detaches handlers,
   * disposes the controller's model unless `save` option is provided,
   * and removes all event listeners.
   *
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid firing `dispose` event
   * @param {boolean} [options.save] whether to avoid disposing the model of the controller
   * @returns {this}
   */
  dispose({ silent, save } = _opt) {
    if (!silent) this.dispatchEvent(new CustomEvent('dispose', { detail: { emitter: this } }));
    if (!save && this.model && this.model.dispose) this.model.dispose();
    if (this.model && this[Symbol.for('c_modelAttributes')].length) {
      this.model.removeEventListener('change', this._onModelChange);
    }
    this.model = undefined;
    this._setEventHandlers(true);
    if (this.constructor.routes) {
      window.removeEventListener('popstate', this._onPopstateEvent);
    }
    const parent = this.parentNode;
    if (parent) parent.removeChild(this);
    return this;
  }

  /**
   * Invoked once the controller is attached to the DOM.
   * By default, controller starts observing attributes of its model.
   * @returns {undefined}
   */
  connectedCallback() {
    if (this.model) this._observeAttributes();
  }

  /**
   * Invoked once the controller is detached from the DOM.
   * By default, disposes of the controller.
   * @returns {undefined}
   */
  disconnectedCallback() {
    this.dispose();
  }

  /**
   * Invoked when observed attributes of the controller are changed.
   * By default, dispatches `attributes` event.
   *
   * @param {string} name the name of the changed attribute
   * @param {*} oldValue previous value of the attribute
   * @returns {undefined}
   */
  attributeChangedCallback(name, oldValue) {
    this._dispatchAttributesEvent(name, oldValue);
  }

  /**
   * Ensures that a given function will only be invoked once in a given time interval.
   *
   * @param {Function} callback a function
   * @param {number} wait a time interval in milliseconds
   * @returns {Function}
   */
  static debounce(callback, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      const later = function () {
        timeout = undefined;
        callback.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Handles one-way binding between the controller's UI and its model.
   *
   * @param {Event} event
   * @param {HTMLElement} target
   * @param {Object} data
   * @returns {void}
   */
  _handleBond(event, target, data) {
    const { value = 'value', bond, parse, prevent } = data;
    if (prevent) event.preventDefault();
    let path = bond !== true ? bond : target.getAttribute('data-bond');
    const content = typeof parse === 'function' ? parse(target[value]) : target[value];
    const isOwnAttribute = path[0] !== ':';
    if (isOwnAttribute) {
      this.setAttribute(path, content);
      return;
    }
    path = path.slice(1);
    const isNested = path.includes('.');
    if (!isNested) {
      this.model[path] = content;
      return;
    }

    let { model } = this;
    const chunks = path.split('.');
    const field = chunks[chunks.length - 1];
    for (let i = 0; i < chunks.length - 1; i += 1) {
      model = model[chunks[i]];
    }
    if (model) model[field] = content;
  }

  /**
   * Pre-processes handlers.
   *
   * @param {Object} handlers
   * @returns {Map}
   */
  _prepareHandlers(handlers) {
    const handlersMap = new Map();
    Object.keys(handlers).forEach((event) => {
      let name = event;
      let selector;
      let data;
      const hasSelector = event.match(_reSplitEvents);
      if (hasSelector) {
        [, name, selector] = hasSelector;
      }
      let callback = handlers[event];
      if (typeof callback === 'object') {
        data = callback;
        callback = data.bond ? this._handleBond : data.handler;
        if (typeof data.parse === 'string') data.parse = this[data.parse];
      }
      if (typeof callback === 'string') callback = this[callback];
      if (typeof callback !== 'function') return;
      if (data && 'debounce' in data) callback = Controller.debounce(callback, data.debounce);
      if (!handlersMap.has(name)) handlersMap.set(name, []);
      handlersMap.get(name).push(hasSelector || data ? [callback, selector, data] : callback);
    });
    return handlersMap;
  }

  /**
   * The actual event handler attached by the controller to every event it's listening to.
   * Internally acts as a dispatcher calling appropriate handlers.
   *
   * @param {Event} event
   * @returns {void}
   */
  _handle(event) {
    const name = event.type.toLowerCase();
    const handlers = this[Symbol.for('c_handlers')] && this[Symbol.for('c_handlers')].get(name);
    if (!handlers) return;
    for (let i = 0; i < handlers.length; i += 1) {
      let data;
      let selector;
      let cb = handlers[i];
      if (Array.isArray(handlers[i])) {
        [cb, selector, data] = handlers[i];
      }
      if (!selector) {
        cb.call(this, event, undefined, data);
      } else if (name !== 'attributes') {
        const el = event.target.closest(selector);
        if (el && this.contains(el)) {
          cb.call(this, event, el, data);
        }
      } else {
        const attribute = event.detail && event.detail.attribute;
        if (attribute && attribute.startsWith(selector)) cb.call(this, event);
      }
    }
  }

  /**
   * Attaches or removes all event handlers at once.
   *
   * @param {boolean} [undelegate] whether to remove the event handlers
   * @returns {this}
   */
  _setEventHandlers(undelegate) {
    const method = undelegate ? 'removeEventListener' : 'addEventListener';
    const handlers = this[Symbol.for('c_handlers')];
    const handler = this._handle;
    if (!handlers) return this;
    handlers.forEach((eventHandlers, eventName) => this[method](eventName, handler), this);
    return this;
  }

  /**
   * Sets up an event listener to observe changes in model attributes.
   *
   * @returns {void}
   */
  _observeAttributes() {
    if (this.model && this[Symbol.for('c_modelAttributes')].length) {
      this.model.removeEventListener('change', this._onModelChange);
      this.model.addEventListener('change', this._onModelChange);
    }
  }

  /**
   *
   * Handles `change` events of controller's model.
   *
   * @returns {void}
   */
  _onModelChange({ detail: { path, previous } }) {
    if (!this[Symbol.for('c_modelAttributes')].some((name) => path.startsWith(name))) return;
    this._dispatchAttributesEvent(path, previous);
  }

  /**
   * Dispatches `attributes` event.
   *
   * @param {string} attribute the attribute name
   * @param {*} previous the previous value of the attribute
   * @returns {void}
   */
  _dispatchAttributesEvent(attribute, previous) {
    this.dispatchEvent(
      new CustomEvent('attributes', { detail: { emitter: this, attribute, previous } }),
    );
  }

  /**
   * Gets the current pathname.
   *
   * @param {string} [fragment]
   * @returns {string}
   */
  _getFragment(fragment) {
    if (fragment !== undefined) return fragment.trim();
    const { root } = this.constructor;
    let newFragment = decodeURIComponent(this.constructor[Symbol.for('c_location')].pathname);
    if (root && newFragment.startsWith(root)) newFragment = newFragment.slice(root.length);
    return newFragment;
  }

  /**
   * Checks whether the URL fragment's been changed.
   *
   * @returns {void}
   */
  _onPopstateEvent() {
    const current = this._getFragment();
    if (current !== this[Symbol.for('c_fragment')]) this._checkUrl();
  }

  /**
   * Checks the current url against routes
   * and emits `route` events if an appropriate route is found.
   *
   * @returns {boolean}
   */
  _checkUrl() {
    this[Symbol.for('c_fragment')] = this._getFragment();
    const { routes } = this.constructor;
    if (!routes) return false;
    const names = Object.keys(routes);
    for (let i = 0; i < names.length; i += 1) {
      const name = names[i];
      const route = routes[name];
      const match = route.exec(this[Symbol.for('c_fragment')]);
      if (match) {
        const params = match.groups;
        const location = this.constructor[Symbol.for('c_location')];
        const hash = decodeURIComponent(location.hash);
        const query = decodeURIComponent(location.search);
        const detail = {
          emitter: this,
          route: name,
          params,
          query,
          hash,
        };
        this.dispatchEvent(new CustomEvent('route', { detail }));
        return true;
      }
    }
    return false;
  }
}

/**
 * A getter that returns an array of attribute names that should be watched for changes.
 * Names of the model attributes should start with `:`, to watch for all changes on the model
 * use just `:`.
 * @type {Array.<string>}
 */
Controller.observedAttributes = [];

/**
 * @typedef {Object} Handler
 * @property {Function} [handler] the callback function to handle the event,
 *                                not used if `bond` is present
 * @property {number} [debounce] the debounce time for the handler
 * @property {(string|boolean)} [bond] name of the property to bond to,
 *                                     or `true` to get the name from the bound element
 * @property {string} [value='value'] the name of the bound elements property
 *                                    to use as a source of a value
 * @property {Function} [parse] the parse function to parse the bounded value
 *                              before updating model or controller with it
 * */

/**
 * A hash of event names and their handlers.
 * @type {Object.<string, (Function|String|Handler)>}
 */
Controller.handlers = undefined;

/**
 * The view or template function used in rendering the controller.
 * @type {Function}
 */
Controller.view = undefined;

/**
 * A hash of route names and their RegExp matchers.
 * @type {Object.<string, RegExp>}
 */
Controller.routes = undefined;

/**
 * A custom root for the controller's router.
 * @type {string}
 */
Controller.root = '';

Controller[Symbol.for('c_history')] = window.history;

Controller[Symbol.for('c_location')] = window.location;

export default Controller;
