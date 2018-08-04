import pathToRegExp from 'path-to-regexp';

/** Used to split event names and selectors in handler declaration. */
const _reSplitEvents = /(\w+)\s+?(.*)/;

/** Used as a source of default options for methods to avoid creating new objects on every call. */
const _opt = Object.seal(Object.create(null));

/** Cached regex for stripping leading and trailing slashes. */
const _reStartingSlash = /^\/+/g;

/** Cached regex for removing trailing slashes. */
const _reTrailingSlash = /\/+$/g;

/**
 * The Controller in MVC.
 * It manages its Model and View while handling user interactions. Controller handles user input
 * through DOM events and updates its Model accordingly. It listens to updates on its Model
 * to re-render its View.
 *
 */
class Controller {
  /**
   * @param {Object} [options]
   * @param {string} [options.el] a CSS selector for the DOM element of the controller
   * @param {string} [options.tagName=div] a tag if the controller should create its own DOM element
   * @param {Object} [options.attributes] attributes to apply to the controller's DOM element
   * @param {Object} [options.handlers] the DOM event handlers for the controller
   * @param {Object} [options.model] the data model used by the controller
   * @param {Object} [options.view] the view or template function used in rendering the controller
   * @param {Object} [options.regions] a hash of regions of the controller
   * @param {Object} [options.routes] a hash of routes
   * @param {string} [options.root]
   */
  constructor(options = _opt) {
    const {
      el, tagName = 'div', attributes, handlers, model, view, regions, routes, root,
    } = options;
    this.el = this.constructor._prepareElement(el, tagName, attributes);
    this._handle = this._handle.bind(this);
    this._handlers = handlers ? this._prepareHandlers(handlers) : undefined;
    this._onRegionDispose = this._onRegionDispose.bind(this);
    this._setEventHandlers();
    this._regionSelectors = regions;
    this._regionControllers = undefined;
    this._observer = undefined;
    this._modelAttributes = undefined;
    this.model = model;
    this.view = view;
    this._observeAttributes();

    if (routes) {
      this._root = root ? (`/${root}`).replace(_reStartingSlash, '/').replace(_reTrailingSlash, '') : '';
      this._routes = Object.entries(routes).map((route) => {
        const keys = [];
        const parsed = pathToRegExp(route[1], keys);
        parsed.route = route[0];
        parsed.keys = keys;
        return parsed;
      });
      this._fragment = '';
      this._location = window.location;
      this._history = window.history;
      this._onPopstateEvent = this._onPopstateEvent.bind(this);
      window.addEventListener('popstate', this._onPopstateEvent);
    }
  }

  /**
   * Renders the controller.
   *
   * By default, invokes `this.view` supplying the controller
   * and returns the controller's DOM element.
   *
   * @returns {HTMLElement} the DOM element of the controller
   */
  render() {
    if (this.view) this.view(this);
    return this.el;
  }

  /**
   * Attaches an event handler to the controller's DOM element.
   *
   * @param {string} [name] the event name
   * @param {(Function|string)} [callback] the handler function. Can be either a function
   *                                      or a name of the controller's method
   * @param {Object} [options]
   * @param {string} [options.handler] if true, the handler is managed by controller's event
   *                                   handling system nd not directly attached to the DOM element.
   * @param {string} [options.selector] the CSS selector to handle events
   *                                    on a specific child element
   * @returns {undefined}
   *
   * @example
   * controller.addEventListener('click', controller.onClick);
   * // attaches `controller.onClick` as a handler for a `click`
   * // event on the controller's DOM element directly
   *
   * controller.addEventListener('click', controller.onClick, { handler: true });
   * // registers `controller.onClick` as a handler for a `click`
   * // in controller's event handling system
   *
   * controller.addEventListener('click', controller.onButtonClick,
   *                             { handler: true, selector: '#button' });
   * // registers `controller.onButtonClick` as a handler for a `click`
   * // event on the `#button` child element
   */
  addEventListener(name, callback, options = _opt) {
    const { handler, selector } = options;
    if (!handler) {
      this.el.addEventListener(name, callback, options);
      return;
    }
    this.removeEventListener(name, callback, options);
    if (!this._handlers) this._handlers = new Map();
    let event = this._handlers.get(name);
    let cb = callback;
    if (typeof cb === 'string') cb = this[cb];
    if (typeof cb !== 'function') return;
    if (!event) {
      event = this._handlers.set(name, []).get(name);
      this.el.addEventListener(name, this._handle);
    }
    event.push(selector ? [cb, selector] : cb);
  }

  /**
   * Detaches an event handler from the controller's DOM element.
   *
   * @param {string} [name] the event name
   * @param {Function} [callback]  the handler function
   * @param {Object} [options]
   * @param {string} [options.handler] whether the handler is in
   *                                   the controller's event handling system
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
   * // from the controller's event handling system
   */
  removeEventListener(name, callback, options = _opt) {
    const { handler, selector } = options;
    if (!handler) {
      this.el.removeEventListener(name, callback, options);
      return;
    }
    const handlers = this._handlers && this._handlers.get(name);
    if (!handlers) return;
    if (!selector) {
      const index = handlers.indexOf(callback);
      if (~index) handlers.splice(index, 1);
    } else {
      handlers.forEach((cb, i) => {
        if (Array.isArray(cb) && (callback === cb[0]) && (selector === cb[1])) {
          handlers.splice(i, 1);
        }
      });
    }
    if (!handlers.length) {
      this._handlers.delete(name);
      this.el.removeEventListener(name, this._handle);
    }
  }

  /**
   * Dispatches an event.
   *
   * @param {Event} event the event object to be dispatched
   * @returns {undefined}
   */
  dispatchEvent(event) {
    this.el.dispatchEvent(event);
  }

  /**
   * Renders a controller or any DOM element inside a region replacing the existing content.
   *
   * @param {string} region the name of the region
   * @param {Controller|HTMLElement} content a DOM element or a controller to render
   * @param {Object} [options]
   * @param {boolean} [options.silent] whether to avoid firing any event
   * @param {boolean} [options.keep] whether to avoid disposing the previous controller
   * @param {boolean} [options.keepModel] whether to avoid disposing the previous controller's model
   * @returns {this}
   * @example
   * controller.show('sidebar', otherController);
   * // renders and inserts the otherController's DOM element inside
   * // the 'sidebar' region of the controller
   *
   * controller.show('sidebar', yetAnotherController);
   * // disposes the current controller and replaces it with the new controller
   *
   * controller.show('sidebar', anotherController);
   * // returns if the controller did not change
   *
   * controller.show('sidebar', otherController, { keep: true });
   * // replaces the previous controller without disposing it
   *
   * controller.show('sidebar', otherController, { keepModel: true });
   * // replaces the previous controller without disposing it's model
   */
  show(region, content, { silent, keep, keepModel } = _opt) {
    const regionElement = this.el.querySelector(this._regionSelectors[region]);
    if (!regionElement) return this;
    const controllers = this._regionControllers || {};
    const previousController = controllers[region];
    const isController = content instanceof Controller;
    const isSame = isController && (content === previousController);
    if (isSame) return this;
    if (!silent) {
      this.dispatchEvent(new CustomEvent(
        'show',
        {
          detail: {
            emitter: this, region, content, keep, keepModel,
          },
        },
      ));
    }

    if (previousController) {
      previousController.removeEventListener('dispose', this._onRegionDispose);
      controllers[region] = undefined;
      if (!keep) {
        previousController.dispose({ save: keepModel });
      }
    }

    let elements = content;
    if (isController) {
      content.addEventListener('dispose', this._onRegionDispose);
      controllers[region] = content;
      elements = content.render();
    }
    this._regionControllers = controllers;
    this._renderRegion(regionElement, elements);
    return this;
  }

  /**
   * Renders content inside a region.
   *
   * @param {HTMLElement} regionElement the DOM element serving as a container for a region
   * @param {HTMLElement} [content] DOM elements to render inside the region
   * @returns {this}
   */
  _renderRegion(regionElement, content) {
    regionElement.innerHTML = '';
    if (content) regionElement.appendChild(content);
    return this;
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
    if (this._fragment === path) return false;
    this._fragment = path;
    const url = this._root + path;
    this._history[replace ? 'replaceState' : 'pushState']({}, document.title, url);
    if (!silent) this._checkUrl();
    return true;
  }

  /**
   * Prepares the controller to be disposed.
   *
   * Removes the controller's element from the DOM, detaches handlers,
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
    if (this._modelAttributes) {
      this.model.removeEventListener('change', this._onModelChange);
    }
    this.model = undefined;
    this._setEventHandlers(true);
    this._disposeRegions();
    if (this._observer) {
      this._observer.disconnect();
      this._observer = undefined;
    }
    if (this._routes) {
      window.removeEventListener('popstate', this._onPopstateEvent);
    }
    const parent = this.el.parentNode;
    if (parent) parent.removeChild(this.el);
    return this;
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
    const {
      value = 'value', bond, parse, nested = false, prevent,
    } = data;
    if (prevent) event.preventDefault();
    const path = bond !== true ? bond : target.getAttribute('data-bond');
    const content = typeof parse === 'function' ? parse(target[value]) : target[value];
    let { model } = this;
    let field = path;
    if (nested) {
      const chunks = path.split('.');
      field = chunks[chunks.length - 1];
      for (let i = 0; i < chunks.length - 1; i += 1) {
        model = model[chunks[i]];
      }
    }
    if (model) model[field] = content;
  }

  /**
   * Pre-processes `this._handlers`.
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
      if (data && ('debounce' in data)) callback = Controller.debounce(callback, data.debounce);
      if (!handlersMap.has(name)) handlersMap.set(name, []);
      handlersMap.get(name).push((hasSelector || data) ? [callback, selector, data] : callback);
    });
    return handlersMap;
  }

  /**
   * The actual event handler attached by the controller to every event it's listening to.
   * Internally acts as a dispatcher calling appropriate handlers set up in `this._handlers`.
   *
   * @param {Event} event
   * @returns {void}
   */
  _handle(event) {
    const name = event.type.toLowerCase();
    const handlers = this._handlers && this._handlers.get(name);
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
      } else {
        const el = event.target.closest(selector);
        if (el && this.el.contains(el)) {
          cb.call(this, event, el, data);
        }
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
    const handlers = this._handlers;
    const handler = this._handle;
    if (!handlers) return this;
    handlers.forEach((eventHandlers, eventName) => this.el[method](eventName, handler), this);
    return this;
  }

  /**
   * Removes references to a disposed controller held in a region.
   *
   * @returns {void}
   */
  _onRegionDispose({ detail: { emitter: controller } } = _opt) {
    if (!this._regionControllers) return;
    const regionEntry = Object.entries(this._regionControllers)
      .find(entry => entry[1] === controller);
    if (regionEntry) this._regionControllers[regionEntry[0]] = undefined;
  }

  /**
   * Disposes all regions of the controller.
   *
   * @returns {void}
   */
  _disposeRegions() {
    if (!this._regionControllers) return;
    const regions = this._regionControllers;
    this._regionControllers = undefined;
    Object.values(regions).forEach((region) => {
      if (region instanceof Controller) {
        region.removeEventListener('dispose', this._onRegionDispose);
        region.dispose();
      }
    });
  }

  /**
   * Sets up a MutationObserver and event listener to watch for changes
   * in attributes of the controller's element or model.
   *
   * @returns {void}
   */
  _observeAttributes() {
    const attributeFilter = this.constructor.observedAttributes;
    const modelAttributes = attributeFilter.filter(attribute => attribute.includes(':'));
    if (modelAttributes.length) {
      this._modelAttributes = modelAttributes;
      this._onModelChange = this._onModelChange.bind(this);
      this.model.addEventListener('change', this._onModelChange);
    }
    if (modelAttributes.length < attributeFilter.length) {
      this._observer = new MutationObserver(({ attributeName, oldValue }) => {
        this._dispatchAttributesEvent(attributeName, oldValue);
      });
      this._observer.observe(this.el, { attributes: true, attributeFilter });
    }
  }

  /**
   *
   * Handles `change` events of controller's model.
   *
   * @returns {void}
   */
  _onModelChange({ detail: { path, previous } }) {
    if (!this._modelAttributes.some(name => path.startsWith(name))) return;
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
    this.el.dispatchEvent(new CustomEvent('attributes', { detail: { emitter: this, attribute, previous } }));
  }

  /**
   * Gets the current pathname.
   *
   * @param {string} [fragment]
   * @returns {string}
   */
  _getFragment(fragment) {
    if (fragment !== undefined) return fragment.trim();
    const root = this._root;
    let newFragment = decodeURIComponent(this._location.pathname);
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
    if (current !== this._fragment) this._checkUrl();
  }

  /**
   * Checks the current url against routes and emits `route` events if an appropriate route is found.
   *
   * @returns {boolean}
   */
  _checkUrl() {
    this._fragment = this._getFragment();
    for (let i = 0; i < this._routes.length; i += 1) {
      const route = this._routes[i];
      if (route.test(this._fragment)) {
        const params = this.constructor._extractParameters(route, this._fragment);
        const name = route.route;
        const hash = decodeURIComponent(this._location.hash);
        const query = decodeURIComponent(this._location.search);
        const detail = {
          emitter: this, route: name, params, query, hash,
        };
        this.el.dispatchEvent(new CustomEvent('route', { detail }));
        return true;
      }
    }
    return false;
  }

  /**
   * Gets an array of extracted parameters from a URL fragment.
   *
   * @param {RegExp} route
   * @param {string} path
   * @returns {Object}
   */
  static _extractParameters(route, path) {
    const matches = route.exec(path);
    const params = {};
    if (matches.length < 2) return params;
    const { keys } = route;
    let n = 0;
    for (let i = 1; i < matches.length; i += 1) {
      const key = keys[i - 1];
      const prop = key ? key.name : n += 1;
      const val = (typeof matches[i] !== 'string') ? matches[i] : decodeURIComponent(matches[i]);

      if (val !== undefined || !Reflect.has(params, prop)) {
        params[prop] = val;
      }
    }
    return params;
  }

  /**
   * Ensures that the controller has a valid DOM element.
   *
   * @param {string|HTMLElement} element
   * @param {string} tagName
   * @param {Object} attributes
   * @returns {HTMLElement}
   */
  static _prepareElement(element, tagName, attributes) {
    const el = (element && document.querySelector(element)) || document.createElement(tagName);
    if (!(attributes)) return el;
    Object.keys(attributes).forEach(name => el.setAttribute(name, attributes[name]));
    return el;
  }
}

/**
 * A getter that returns an array of attribute names that should be watched for changes.
 * Names of the model attributes should start with `:`, to watch for all changes on the model
 * use just `:`.
 */
Controller.observedAttributes = [];

export default Controller;
