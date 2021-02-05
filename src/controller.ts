import { LitElement } from 'lit-element';
import { ITranslations, Translator, sTranslator } from './translator';
import { sObservable, Observable } from './observable';
import { RouteEvent } from './events/route';
import { isBound } from './utilities';

const sCurrentPath = Symbol.for('c-current-path');

const sRoutes = Symbol.for('c-routes');

interface IRoutes {
  [route: string]: RegExp;
}

export type ControllerType<T> = new () => Controller<T>;

export class Controller<T = any> extends LitElement {
  rootPath?: string;
  [sObservable]?: Observable<T>;
  [sCurrentPath]?: string;
  [sRoutes]?: IRoutes;
  static translations?: ITranslations;

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
  async onModelChange() {
    await this.requestUpdate();
  }

  /**
   * The routes defined on the component.
   */
  get routes(): IRoutes | undefined {
    return this[sRoutes];
  }

  set routes(routes: IRoutes | undefined) {
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
   * @emits RouteEvent
   */
  route(
    name: string,
    params: Record<string, string>,
    query?: URLSearchParams,
    hash?: string,
  ): void {
    this.dispatchEvent(RouteEvent.create({ route: name, params, query, hash }));
  }

  /**
   * Checks the current URL against routes and invokes `Component#route`
   * if an appropriate route is found.
   */
  onPopstate(): void {
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
      this.route(name, params, query, hash);
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
