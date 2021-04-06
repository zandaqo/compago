import { LitElement } from 'lit-element';
import { Translations, Translator, sTranslator } from './translator';
import { sObservable, Observable } from './observable';
import { RouteEvent } from './events/route';
import { isBound } from './utilities';
import { ChangeEvent } from './events/change';

const sCurrentPath = Symbol.for('c-current-path');

const sRoutes = Symbol.for('c-routes');

type Routes = {
  [route: string]: RegExp;
};

export class Controller<T = any> extends LitElement {
  rootPath?: string;
  [sObservable]?: Observable<T>;
  [sCurrentPath]?: string;
  [sRoutes]?: Routes;
  static translations?: Translations;

  connectedCallback(): void {
    super.connectedCallback();
    const { translator } = this.constructor as typeof Controller;
    if (translator) {
      if (!isBound(this.onLanguageChange))
        this.onLanguageChange = this.onLanguageChange.bind(this);
      translator.addEventListener('language-change', this.onLanguageChange);
    }
  }

  disconnectedCallback(): void {
    const { translator } = this.constructor as typeof Controller;
    if (translator) {
      translator.removeEventListener('language-change', this.onLanguageChange);
    }
    if (this.model) this.model = undefined;
    if (this.routes) this.routes = undefined;
    super.disconnectedCallback();
  }

  /**
   * The component's model
   */
  get model() {
    return this[sObservable];
  }

  set model(model) {
    const oldModel = this.model;
    if (oldModel === model) return;
    if (oldModel) {
      oldModel.removeEventListener('change', this.onModelChange);
    }
    if (model) {
      if (!isBound(this.onModelChange))
        this.onModelChange = this.onModelChange.bind(this);
      model.addEventListener('change', this.onModelChange);
      this.requestUpdate();
    }
    this[sObservable] = model;
  }

  /**
   * Handles `change` events of the component's model.
   */
  onModelChange(_: ChangeEvent): void {
    this.requestUpdate();
  }

  /**
   * The routes defined on the component.
   */
  get routes(): Routes | undefined {
    return this[sRoutes];
  }

  set routes(routes: Routes | undefined) {
    const oldRoutes = this.routes;
    if (oldRoutes === routes) return;
    this[sCurrentPath] = '';
    this[sRoutes] = routes;
    if (!routes) {
      globalThis.removeEventListener('popstate', this.onPopstate);
    } else {
      if (!isBound(this.onPopstate)) this.onPopstate = this.onPopstate.bind(this);
      globalThis.addEventListener('popstate', this.onPopstate);
    }
  }

  /**
   * Invoked when a route is visited. By default emits a `route` event.
   *
   * @param name name of the route as defined in `Component#routes`
   * @param params
   * @param query
   * @param hash
   * @param state
   * @emits RouteEvent
   */
  route(
    name: string,
    params: Record<string, string>,
    query?: URLSearchParams,
    hash?: string,
    state?: any,
  ): void {
    this.dispatchEvent(RouteEvent.create({ route: name, params, query, hash, state }));
  }

  /**
   * Checks the current URL against routes and invokes `Component#route`
   * if an appropriate route is found.
   */
  onPopstate(event: PopStateEvent): void {
    const { rootPath: root = '', [sRoutes]: routes = {} } = this;
    const { location } = globalThis;
    let path = decodeURIComponent(location.pathname);
    if (path === this[sCurrentPath]) return;
    this[sCurrentPath] = path;
    if (root && !path.startsWith(root)) return;
    path = path.slice(root.length);
    const names = Object.keys(routes);
    for (let i = 0; i < names.length; i += 1) {
      const name = names[i];
      const route = routes[name];
      const match = route.exec(path);
      if (!match) continue;
      const params = match.groups || {};
      const hash = decodeURIComponent(location.hash);
      const query = location.search ? new URLSearchParams(location.search) : undefined;
      this.route(name, params, query, hash, event.state);
      return;
    }
  }

  /**
   * Invoked when the translator changes the current language emitting a `language-change` event.
   */
  async onLanguageChange(): Promise<void> {
    await this.requestUpdate();
  }

  /**
   * The translator instance used by the component.
   */
  static get translator(): Translator | undefined {
    return (globalThis as any)[sTranslator];
  }

  /**
   * Translates a given key using the component's translations in addition to global translations.
   * Proxies to `Translator#translate` method.
   *
   * @param key
   * @param interpolation
   * @returns the translation
   */
  static translate(key: string, interpolation?: any): string {
    const { translator, translations = {}, name } = this;
    return translator?.translate(translations, key, interpolation, name) || key;
  }
}
