import Listener from './listener';

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
 * @mixes Listener
 */
class Controller extends Listener() {
  /**
   * @param {Object} [options]
   * @param {(HTMLElement|string)} [options.el] the DOM element for the controller
   * @param {string} [options.tagName] a tag if the controller should create its own DOM element
   * @param {Object} [options.attributes] attributes to apply to the controller's DOM element
   * @param {Object} [options.handlers] the DOM event handlers for the controller
   * @param {Object} [options.model] the data model used by the controller
   * @param {Object} [options.view] the view or template function used in rendering the controller
   * @param {string} [options.renderEvents] the model events that cause the controller to re-render
   * @param {Array} [options.renderAttributes] the attributes of the controller's element
   *                                          that cause it to re-render
   * @param {Object} [options.regions] a hash of regions of the controller
   */
  constructor(options = _opt) {
    const { el, tagName, attributes, handlers, model,
      view, renderEvents, renderAttributes, regions } = options;
    super();
    this.tagName = tagName || 'div';
    this.attributes = attributes;
    this.el = this._prepareElement(el);
    this.handlers = handlers ? this._prepareHandlers(handlers) : undefined;
    this._handle = this._handle.bind(this);
    this._setEventHandlers();
    this._regionSelectors = regions;
    this._regionControllers = undefined;
    this._observer = undefined;
    this.model = model;
    this.view = view;
    if (renderEvents) {
      this.on(this.model, renderEvents, this.render);
    }
    if (renderAttributes) {
      this._observeAttributes(renderAttributes);
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
   * Attaches a handler to an event.
   *
   * If no event or callback is provided, attaches all handlers
   *    in `this.handlers` to the appropriate events.
   *
   * @param {string} [name] the event name
   * @param {(Function|string)} [callback] the handler function. Can be either a function
   *                                      or a name of the controller's method
   * @param {string} [selector] the CSS selector to handle events on a specific child element
   * @returns {this}
   *
   * @example
   * controller.delegate();
   * // attaches all event handlers specified in `controller.handlers` to their appropriate events
   *
   * controller.delegate('click', controller.onClick);
   * // attaches `controller.onClick` as handler for any `click`
   * // event on the controller's DOM element and its children
   *
   * controller.delegate('click', controller.onButtonClick, '#button');
   * // attaches `controller.onButtonClick` as a handler for the `click`
   * // event on the `#button` child element
   */
  delegate(name, callback, selector) {
    let event = this.handlers && this.handlers.get(name);
    let cb = callback;
    this.undelegate(name, cb, selector);
    if (!name || !cb) {
      this._setEventHandlers();
      return this;
    }
    if (typeof cb === 'string') cb = this[cb];
    if (typeof cb !== 'function') return this;
    if (!event) {
      event = this.handlers.set(name, []).get(name);
      this.el.addEventListener(name, this._handle);
    }
    event.push(selector ? [cb, selector] : cb);
    return this;
  }

  /**
   * Detaches event handlers.
   *
   * @param {string} [name] the event name
   * @param {Function} [callback]  the handler function
   * @param {string} [selector] the CSS selector
   * @returns {this}
   *
   * @example
   * controller.undelegate();
   * // detaches all DOM event handlers of the controller
   *
   * controller.undelegate('click', controller.onClick);
   * // removes `controller.onClick` as a handler for the `click` event
   *
   * controller.undelegate('click', controller.onButtonClick, '#button');
   * // removes `controller.onButtonClick` as a handler
   * // for the `click` events on `#button` child element
   */
  undelegate(name, callback, selector) {
    if (!name || !callback) {
      this._setEventHandlers(true);
      return this;
    }
    const handlers = this.handlers.get(name);
    if (!handlers) return this;
    if (!selector) {
      const index = handlers.indexOf(callback);
      if (~index) handlers.splice(index, 1);
    } else {
      handlers.forEach((handler, i) => {
        if (Array.isArray(handler) && (callback === handler[0]) && (selector === handler[1])) {
          handlers.splice(i, 1);
        }
      });
    }
    if (!handlers.length) {
      this.handlers.delete(name);
      this.el.removeEventListener(name, this._handle);
    }
    return this;
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
    if (!silent) this.emit('show', { region, content, keep, keepModel });

    if (previousController) {
      this.off(previousController, 'dispose', this._onRegionDispose);
      controllers[region] = undefined;
      if (!keep) {
        previousController.dispose({ save: keepModel });
      }
    }

    let elements = content;
    if (isController) {
      this.on(content, 'dispose', this._onRegionDispose);
      controllers[region] = content;
      elements = content.render();
    }
    this._regionControllers = controllers;
    this.renderRegion(regionElement, elements);
    return this;
  }

  /**
   * Renders content inside a region.
   *
   * @param {HTMLElement} regionElement the DOM element serving as a container for a region
   * @param {HTMLElement} [content] DOM elements to render inside the region
   * @returns {this}
   */
  renderRegion(regionElement, content) {
    regionElement.innerHTML = '';
    if (content) regionElement.appendChild(content);
    return this;
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
    if (!silent) this.emit('dispose');
    if (!save && this.model && this.model.dispose) this.model.dispose();
    this.model = undefined;
    this.undelegate();
    this._disposeRegions();
    if (this._observer) {
      this._observer.disconnect();
      this._observer = undefined;
    }
    const parent = this.el.parentNode;
    if (parent) parent.removeChild(this.el);
    this.off().free();
    return this;
  }

  /**
   * Ensures that the controller has a valid DOM element.
   *
   * @param {string|HTMLElement} element
   * @returns {HTMLElement}
   */
  _prepareElement(element) {
    const attributes = this.attributes;
    let el = element;
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el || (el.nodeType !== 1)) el = document.createElement(this.tagName);
    if (!(attributes)) return el;
    const names = Object.keys(attributes);
    for (let i = names.length - 1; i >= 0; i -= 1) {
      const key = names[i];
      el.setAttribute(key, attributes[key]);
    }
    return el;
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
    const { value = 'value', bond, parse, nested = false, prevent } = data;
    if (prevent) event.preventDefault();
    const field = bond !== true ? bond : target.getAttribute('data-bond');
    // todo use new model
    this.model.set({ [field]: typeof parse === 'function' ? parse(target[value]) : target[value] }, { nested });
  }

  /**
   * Pre-processes `this.handlers`.
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
      if (data && ('debounce' in data)) callback = Controller._handleDebounce(callback, data.debounce);
      if (!handlersMap.has(name)) handlersMap.set(name, []);
      handlersMap.get(name).push((hasSelector || data) ? [callback, selector, data] : callback);
    });
    return handlersMap;
  }

  /**
   * The actual event handler attached by the controller to every event it's listening to.
   * Internally acts as a dispatcher calling appropriate handlers set up in `this.handlers`.
   *
   * @param {Event} event
   * @returns {void}
   */
  _handle(event) {
    const name = event.type.toLowerCase();
    const handlers = this.handlers && this.handlers.get(name);
    if (!handlers) return;
    for (let i = 0, l = handlers.length; i < l; i += 1) {
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
    const handlers = this.handlers;
    const handler = this._handle;
    const el = this.el;
    if (!handlers) return this;
    handlers.forEach((eventHandlers, eventName) => {
      el[method](eventName, handler);
    });
    return this;
  }

  /**
   * Removes references to a disposed controller held in a region.
   *
   * @returns {void}
   */
  _onRegionDispose({ emitter: controller } = _opt) {
    if (!this._regionControllers) return;
    const regions = Object.keys(this._regionControllers);
    for (let i = 0; i < regions.length; i += 1) {
      const region = regions[i];
      if (this._regionControllers[region] === controller) {
        this._regionControllers[region] = undefined;
        break;
      }
    }
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
    const regionNames = Object.keys(regions);
    for (let i = 0; i < regionNames.length; i += 1) {
      const name = regionNames[i];
      const region = regions[name];
      if (region instanceof Controller) {
        this.off(region, 'dispose');
        region.dispose();
      }
    }
  }

  /**
   * Sets up a MutationObserver to watch for changes in attributes of the controller.
   *
   * @param {Array.<String>} attributeFilter the list attributes to watch
   * @returns {void}
   */
  _observeAttributes(attributeFilter) {
    this._observer = new MutationObserver(() => {
      this.render();
    });
    this._observer.observe(this.el, { attributes: true, attributeFilter });
  }

  /**
   *
   * @param {Function} callback
   * @param {number} wait
   * @returns {Function}
   */
  static _handleDebounce(callback, wait) {
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
}

export default Controller;
