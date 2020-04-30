import { LitElement } from 'lit-element';

const fragment = Symbol.for('c_fragment');

/**
 * The Controller in MVC.
 * It manages its Model and View while handling user interactions. Controller handles user input
 * through DOM events and updates its Model accordingly. It listens to updates on its Model
 * to re-render its View.
 *
 * @extends LitElement
 */
class Controller extends LitElement {
  /**
   * Handles one-way binding to model or controller properties.
   *
   * @param {Event} event
   * @returns {void}
   */
  bond(event) {
    const { target } = event;
    if (!target.binding) throw TypeError('No binding configuration found.');
    const { value = 'value', property, parse, prevent } = target.binding;
    if (prevent) event.preventDefault();
    let path = property;
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
   * Saves a URL from the event target's href into the browser history.
   *
   * @param {Event} event
   * @returns {void}
   */
  navigate(event) {
    const { target } = event;
    // allow storing the URL in data-href attribute as well
    const path = target.href || target.getAttribute('data-href');
    if (!path) return;
    event.preventDefault();
    globalThis.history.pushState({}, globalThis.document.title, path);
  }

  /**
   * Checks the current URL against routes and emits a `route` event if an appropriate route is found.
   *
   * @returns {void}
   */
  onPopstate() {
    const { root, routes } = this.constructor;
    const { location } = globalThis;
    let path = decodeURIComponent(location.pathname);
    if (path === this[fragment]) return;
    this[fragment] = path;
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
      const detail = {
        emitter: this,
        route: name,
        params,
        query,
        hash,
      };
      this.dispatchEvent(new CustomEvent('route', { detail, bubbles: true, composed: true }));
      return;
    }
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
   * Prepares the controller for removal by detaching it from its model.
   *
   * @returns {void}
   */
  dispose() {
    if (this.constructor.routes) globalThis.removeEventListener('popstate', this.onPopstate);
    if (this.model) {
      this.model.removeEventListener('change', this.onModelChange);
      this.model = undefined;
    }
  }

  /**
   * Invoked once the controller is attached to the DOM.
   * By default, controller starts observing attributes of its model.
   * @returns {undefined}
   */
  connectedCallback() {
    super.connectedCallback();

    // listen to popstate events if routes are set
    if (this.constructor.routes) {
      this[fragment] = '';
      this.onPopstate = this.onPopstate.bind(this);
      globalThis.addEventListener('popstate', this.onPopstate);
    }

    // listen to model changes if it's present
    if (this.model) {
      this.onModelChange = this.onModelChange.bind(this);
      this.model.addEventListener('change', this.onModelChange);
    }
  }

  /**
   * Invoked once the controller is detached from the DOM.
   * By default, disposes of the controller.
   * @returns {undefined}
   */
  disconnectedCallback() {
    this.dispose();
    super.disconnectedCallback();
  }
}

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

export default Controller;
