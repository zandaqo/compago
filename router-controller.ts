import type {
  ReactiveController,
  ReactiveControllerHost,
} from "@lit/reactive-element";
import { RouteDetail, RouteEvent } from "./route-event.ts";

export type RouteConfig = {
  /**
   * The name of the route
   */
  name: string;
  /**
   * RegExp matching the path
   */
  path: RegExp;
  /**
   * The URL to dynamically import a component
   */
  load?: string;
  /**
   * The component tag name
   */
  component?: keyof HTMLElementTagNameMap;
  /**
   * The custom handler
   *
   * @param route details of the matched route
   */
  action?(route: RouteDetail): void;
};

/**
 * A controller to serve as a client-side router.
 */
export class RouterController<T extends ReactiveControllerHost>
  implements ReactiveController {
  host: T;
  root = "";
  current = "";
  outlet: keyof T;
  routes: Array<RouteConfig>;
  static location = window.location;
  /**
   * @param host the controller host
   * @param routes an array of routes
   * @param outlet the host property to which the created components are assigned
   * @param root the base path of the router
   */
  constructor(
    host: T,
    routes: Array<RouteConfig>,
    outlet: keyof T,
    root = "",
  ) {
    (this.host = host).addController(this);
    this.routes = routes;
    this.root = root;
    this.outlet = outlet;
    this.onPopstate = this.onPopstate.bind(this);
  }

  onPopstate(event: PopStateEvent): void {
    const { host, root, routes } = this;
    const { location } = this.constructor as typeof RouterController;
    let path = decodeURIComponent(location.pathname);
    if (path === this.current) return;
    this.current = path;
    if (root && !path.startsWith(root)) return;
    path = path.slice(root.length);
    for (const route of routes) {
      const match = route.path.exec(path);
      if (!match) continue;
      const params = match.groups || {};
      const hash = location.hash && decodeURIComponent(location.hash);
      const query = location.search
        ? new URLSearchParams(location.search)
        : undefined;
      const detail: RouteDetail = {
        name: route.name,
        params,
        query,
        hash,
        state: event.state,
      };
      if (route.action) {
        route.action.call(host, detail);
      } else if (route.component) {
        this.setComponent(detail, route.component, route.load);
      }
      (host as unknown as HTMLElement).dispatchEvent(
        new RouteEvent(detail),
      );
      return;
    }
  }

  async setComponent(
    detail: RouteDetail,
    component: keyof HTMLElementTagNameMap,
    load?: string,
  ) {
    if (load) await import(load);
    const element = window.document.createElement(component);
    // deno-lint-ignore no-explicit-any
    (element as any).location = detail;
    // deno-lint-ignore no-explicit-any
    (this.host[this.outlet] as any) = element;
  }

  hostConnected() {
    globalThis.addEventListener("popstate", this.onPopstate);
  }

  hostDisconnected() {
    globalThis.removeEventListener("popstate", this.onPopstate);
  }

  /**
   * Repaces the current history entry and emits a popstate event triggering routers.
   *
   * @param url the new url for the hisotyr entry
   * @param title page title (unsupported)
   * @param state the state object associated with the history entry
   */
  static redirect(url: string, title = "", state?: unknown) {
    window.history.replaceState(state, title, url);
    globalThis.dispatchEvent(new PopStateEvent("popstate", { state }));
  }
}
