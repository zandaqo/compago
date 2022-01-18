import type { ReactiveController, ReactiveControllerHost } from "./deps.ts";
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
export class RouterController<T extends ReactiveControllerHost & HTMLElement>
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
  }

  onClick = (event: MouseEvent) => {
    const isNonNavigationClick = event.button !== 0 || event.metaKey ||
      event.ctrlKey || event.shiftKey;
    if (event.defaultPrevented || isNonNavigationClick) {
      return;
    }

    const anchor = event
      .composedPath()
      .find((n) => (n as HTMLElement).tagName === "A") as
        | HTMLAnchorElement
        | undefined;
    if (
      anchor === undefined ||
      anchor.target !== "" ||
      anchor.hasAttribute("download") ||
      anchor.getAttribute("rel") === "external"
    ) {
      return;
    }

    const href = anchor.href;
    if (href === "" || href.startsWith("mailto:")) {
      return;
    }

    const location = RouterController.location;
    const origin = location.origin || location.protocol + "//" + location.host;
    if (anchor.origin !== origin) {
      return;
    }

    event.preventDefault();
    if (href !== location.href) {
      window.history.pushState({}, "", href);
      this.goto(anchor.pathname);
    }
  };

  onPopstate = (_event: PopStateEvent) => {
    this.goto(RouterController.location.pathname);
  };

  goto(path: string) {
    if (path === this.current) return;
    this.current = path;
    if (this.root && !path.startsWith(this.root)) return;
    path = path.slice(this.root.length);
    for (const route of this.routes) {
      const match = route.path.exec(path);
      if (!match) continue;
      const params = match.groups || {};
      const detail: RouteDetail = {
        name: route.name,
        params,
      };
      if (route.action) {
        route.action.call(this.host, detail);
      } else if (route.component) {
        this.setComponent(detail, route.component, route.load);
      }
      this.host.dispatchEvent(new RouteEvent(detail));
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
    this.host.addEventListener("click", this.onClick as EventListener);
    globalThis.addEventListener("popstate", this.onPopstate);
  }

  hostDisconnected() {
    this.host.removeEventListener("click", this.onClick as EventListener);
    globalThis.removeEventListener("popstate", this.onPopstate);
  }

  static redirect(url: string, state?: unknown) {
    window.history.replaceState(state, "", url);
    globalThis.dispatchEvent(new PopStateEvent("popstate", { state }));
  }

  static go(url: string, state?: unknown) {
    if (url === window.location.href) return;
    window.history.pushState(state, "", url);
    globalThis.dispatchEvent(new PopStateEvent("popstate", { state }));
  }
}
