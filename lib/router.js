/**
 * @extends {HTMLElement}
 */
class Router extends HTMLElement {
  constructor() {
    super();
    this.currentPath = '';

    /**
     * A custom root for the controller's router.
     * @type {string}
     */
    this.root = '';

    /**
     * A hash of route names and their RegExp matchers.
     * @type {Object.<string, RegExp>}
     */
    this.routes = undefined;
  }

  connectedCallback() {
    if (this.routes) {
      this.currentPath = '';
      this.onPopstate = this.onPopstate.bind(this);
      globalThis.addEventListener('popstate', this.onPopstate);
    }
    this.style.display = 'none';
  }

  disconnectedCallback() {
    if (this.routes) globalThis.removeEventListener('popstate', this.onPopstate);
  }

  /**
   * Checks the current URL against routes and emits a `route` event if an appropriate route is found.
   *
   * @returns {void}
   */
  onPopstate() {
    const { root, routes } = this;
    const { location } = globalThis;
    let path = decodeURIComponent(location.pathname);
    if (path === this.currentPath) return;
    this.currentPath = path;
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
}

if (globalThis.customElements) {
  globalThis.customElements.define('compago-router', Router);
}

export default Router;
