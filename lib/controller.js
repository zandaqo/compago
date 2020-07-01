import { LitElement } from 'lit-element/lit-element.js';
import { directive } from 'lit-html';

/**
 * @private
 * @type {symbol}
 */
const currentPathSymbol = Symbol.for('c-current-path');

/**
 * @private
 * @type {symbol}
 */
const routesSymbol = Symbol.for('c-routes');

/**
 * @typedef {Object} ControllerBond
 * @property {string} to
 * @property {Function} [parse]
 * @property {boolean} [prevent]
 * @property {string} [property]
 * @property {string} [attribute]
 * @property {*} [value]
 */

/**
 * @private
 * @param {Function} f
 * @returns {boolean}
 */
function isBound(f) {
  return f.name.startsWith('bound ');
}

/**
 * @typedef {Object<string, RegExp>} Routes
 */

/**
 * The Controller in MVC.
 * It manages its Model and View while handling user interactions. Controller handles user input
 * through DOM events and updates its Model accordingly. It listens to updates on its Model
 * to re-render its View.
 *
 * @extends LitElement
 */
export default class Controller extends LitElement {
  /**
   * Invoked once the controller is attached to the DOM.
   *
   * @returns {void}
   */
  connectedCallback() {
    super.connectedCallback();
    const { translator } = this.constructor;
    if (translator) {
      if (!isBound(this.onLanguageChange)) this.onLanguageChange = this.onLanguageChange.bind(this);
      translator.addEventListener('language', this.onLanguageChange);
    }
  }

  /**
   * Invoked once the controller is detached from the DOM.
   *
   * @returns {void}
   */
  disconnectedCallback() {
    const { translator } = this.constructor;
    if (translator) {
      translator.removeEventListener('language', this.onLanguageChange);
    }
    if (this.model) this.model = undefined;
    if (this.routes) this.routes = undefined;
    super.disconnectedCallback();
  }

  /**
   * @type {Model|ModelArray}
   */
  get model() {
    return this[Symbol.for('c-model')];
  }

  /**
   * @param {Model|ModelArray} model
   * @returns {void}
   */
  set model(model) {
    const oldModel = this.model;
    if (oldModel === model) return;
    if (oldModel) {
      oldModel.removeEventListener('change', this.onModelChange);
    }
    if (model) {
      if (!isBound(this.onModelChange)) this.onModelChange = this.onModelChange.bind(this);
      model.addEventListener('change', this.onModelChange);
      this.requestUpdate();
    }
    this[Symbol.for('c-model')] = model;
  }

  /**
   * Handles `change` events of the controller's model.
   *
   * @returns {void}
   */
  async onModelChange() {
    await this.requestUpdate();
  }

  /**
   * @type {Routes}
   */
  get routes() {
    return this[routesSymbol];
  }

  /**
   * @param {Routes} routes
   */
  set routes(routes) {
    const oldRoutes = this.routes;
    if (oldRoutes === routes) return;
    this[currentPathSymbol] = '';
    this[routesSymbol] = routes;
    if (!routes) {
      globalThis.removeEventListener('popstate', this.onPopstate);
    } else {
      if (!isBound(this.onPopstate)) this.onPopstate = this.onPopstate.bind(this);
      globalThis.addEventListener('popstate', this.onPopstate);
    }
  }

  /**
   * @param {string} name
   * @param {Object} params
   * @param {string} query
   * @param {string} hash
   * @returns {void}
   */
  route(name, params, query, hash) {
    const detail = {
      emitter: this,
      route: name,
      params,
      query,
      hash,
    };
    this.dispatchEvent(new CustomEvent('route', { detail, bubbles: true, composed: true }));
  }

  /**
   * Checks the current URL against routes and emits a `route` event if an appropriate route is found.
   *
   * @private
   * @returns {void}
   */
  onPopstate() {
    const { rootPath: root = '', [routesSymbol]: routes } = this;
    const { location } = globalThis;
    let path = decodeURIComponent(location.pathname);
    if (path === this[currentPathSymbol]) return;
    this[currentPathSymbol] = path;
    if (root && !path.startsWith(root)) return;
    path = path.slice(root.length);
    const names = Object.keys(routes);
    for (let i = 0; i < names.length; i += 1) {
      const name = names[i];
      const route = routes[name];
      const match = route.exec(path);
      if (!match) continue;
      const params = match.groups;
      const hash = decodeURIComponent(location.hash);
      const query = decodeURIComponent(location.search);
      this.route(name, params, query, hash);
      return;
    }
  }

  /**
   * @returns {void}
   */
  async onLanguageChange() {
    await this.requestUpdate();
  }

  /**
   * @type {Translator}
   */
  static get translator() {
    return globalThis[Symbol.for('c-translator')];
  }

  /**
   * @param {string} key
   * @param {*} [interpolation]
   * @returns {string}
   */
  static translate(key, interpolation) {
    const { translator, translations, name } = this;
    return translator ? translator.translate(translations, key, interpolation, name) : key;
  }
}

/**
 * @type {Translations}
 */
Controller.translations = {};

/**
 * Handles one-way binding to model or controller properties.
 *
 * @param {ControllerBond} binding
 * @returns {void}
 */
Controller.bond = directive((binding) => (part) => {
  const { to, parse, prevent, property = 'value', attribute, value } = binding;
  let path = to;
  let recipient = part.eventContext;
  if (path[0] === ':') {
    recipient = part.eventContext.model;
    path = path.slice(1);
  }
  if (path.includes('.')) {
    const chunks = path.split('.');
    path = chunks[chunks.length - 1];
    for (let i = 0; i < chunks.length - 1; i += 1) {
      recipient = recipient[chunks[i]];
    }
  }

  part.setValue(
    !recipient || !path
      ? undefined
      : (event) => {
          if (prevent) event.preventDefault();
          let content = Reflect.has(binding, 'value')
            ? value
            : attribute != null
            ? part.element.getAttribute(attribute)
            : part.element[property];
          if (typeof parse === 'function') content = parse(content);
          recipient[path] = content;
        },
  );
});

/**
 * Saves a given URL (or the URL from href property of the element) into the browser history.
 *
 * @param {string} [href]
 * @returns {void}
 */
Controller.navigate = directive((href) => (part) => {
  const path = href || part.element.href;
  part.setValue(
    path
      ? (event) => {
          event.preventDefault();
          globalThis.history.pushState({}, globalThis.document.title, path);
          globalThis.dispatchEvent(new PopStateEvent('popstate'));
        }
      : undefined,
  );
});

/**
 * @param {Class<Controller>} ctor
 * @param {string} key
 * @param {*} [interpolation]
 * @returns {void}
 */
Controller.ts = directive((ctor, key, interpolation) => (part) => {
  part.setValue(ctor.translate(key, interpolation));
});
